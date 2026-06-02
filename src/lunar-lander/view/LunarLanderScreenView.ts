/**
 * LunarLanderScreenView.ts
 *
 * Top-level view: builds the (uniform-scale, inverted-Y) model-view transform,
 * assembles the scene (starfield, terrain, lander, vectors), the instrument
 * panel, score, on-screen throttle controls, and the global keyboard controls.
 * Overlays and sound are layered on in later steps.
 */
import { Bounds2, Matrix3, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { HBox, KeyboardListener, Node } from "scenerystack/scenery";
import { PlayPauseButton, ResetAllButton } from "scenerystack/scenery-phet";
import type { ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import LunarLanderConstants from "../model/LunarLanderConstants.js";
import type { LunarLanderModel } from "../model/LunarLanderModel.js";
import { ControlPanel } from "./ControlPanel.js";
import { ExplosionNode } from "./ExplosionNode.js";
import { LanderNode } from "./LanderNode.js";
import { LunarLanderSoundView } from "./LunarLanderSoundView.js";
import { MessageNode } from "./MessageNode.js";
import { ScoreReadoutNode } from "./ScoreReadoutNode.js";
import { StarfieldNode } from "./StarfieldNode.js";
import { StartOverlayNode } from "./StartOverlayNode.js";
import { TerrainNode } from "./TerrainNode.js";
import { ThrottleControlNode } from "./ThrottleControlNode.js";
import { VectorsNode } from "./VectorsNode.js";

type LunarLanderScreenViewOptions = ScreenViewOptions & { tandem: Tandem };

const {
  SCREEN_VIEW_MARGIN,
  CONTROL_PANEL_WIDTH,
  MODEL_MIN_Y,
  MODEL_MAX_ALTITUDE,
  ZOOM_START_ALTITUDE,
  ZOOM_MAX,
  ZOOM_OUT_TOP_FRACTION,
  ZOOM_OUT_MIN,
} = LunarLanderConstants;

export class LunarLanderScreenView extends ScreenView {
  protected readonly modelViewTransform: ModelViewTransform2;
  protected readonly playAreaViewBounds: Bounds2;
  protected readonly model: LunarLanderModel;
  // Holds the world-space scene (terrain, vectors, lander, explosion); its matrix
  // is the camera that zooms toward the landing site as the lander descends.
  private readonly worldNode: Node;
  private readonly landerNode: LanderNode;
  private readonly explosionNode: ExplosionNode;
  private readonly soundView: LunarLanderSoundView;

  public constructor(model: LunarLanderModel, providedOptions: LunarLanderScreenViewOptions) {
    super(providedOptions);
    this.model = model;

    const layoutBounds = this.layoutBounds;
    const margin = SCREEN_VIEW_MARGIN;

    // Play area: everything left of the right-hand control column.
    const playLeft = margin;
    const playTop = margin;
    const playRight = layoutBounds.maxX - CONTROL_PANEL_WIDTH - 2 * margin;
    const playBottom = layoutBounds.maxY - margin;
    const playW = playRight - playLeft;
    const playH = playBottom - playTop;

    // Uniform-scale inverted-Y mapping. The play area is filled edge-to-edge; the
    // base (unzoomed) view shows the full altitude band [MODEL_MIN_Y, MAX_ALTITUDE]
    // vertically, and horizontally a window of the (much wider than one screen)
    // moon, sized from the play-area aspect so the scale stays uniform. The camera
    // then pans this window to follow the lander left/right and zooms it toward the
    // landing site as it descends.
    this.playAreaViewBounds = new Bounds2(playLeft, playTop, playRight, playBottom);
    const modelViewHeight = MODEL_MAX_ALTITUDE - MODEL_MIN_Y;
    const modelViewWidth = modelViewHeight * (playW / playH);
    const terrainCenterX = (model.terrain.minX + model.terrain.maxX) / 2;
    const modelBounds = new Bounds2(
      terrainCenterX - modelViewWidth / 2,
      MODEL_MIN_Y,
      terrainCenterX + modelViewWidth / 2,
      MODEL_MAX_ALTITUDE,
    );
    this.modelViewTransform = ModelViewTransform2.createRectangleInvertedYMapping(modelBounds, this.playAreaViewBounds);

    const starfield = new StarfieldNode(layoutBounds);
    const terrainNode = new TerrainNode(model.terrain, this.modelViewTransform);
    const vectorsNode = new VectorsNode(model, this.modelViewTransform);
    this.landerNode = new LanderNode(model, this.modelViewTransform);
    this.explosionNode = new ExplosionNode(model, this.modelViewTransform);

    // World layer carries everything anchored to model space; the camera matrix
    // applied to it zooms in on the landing site. The camera node clips to the
    // play area so the zoomed world never spills under the panels or off the top.
    this.worldNode = new Node({ children: [terrainNode, vectorsNode, this.landerNode, this.explosionNode] });
    const cameraNode = new Node({
      children: [this.worldNode],
      clipArea: Shape.bounds(this.playAreaViewBounds),
    });
    model.lander.positionProperty.link(() => this.updateCamera());

    const messageNode = new MessageNode(
      model,
      new Vector2(this.playAreaViewBounds.centerX, this.playAreaViewBounds.minY + this.playAreaViewBounds.height * 0.3),
    );

    const controlPanel = new ControlPanel(model);
    controlPanel.right = layoutBounds.maxX - margin;
    controlPanel.top = margin;

    const scoreReadout = new ScoreReadoutNode(model);
    scoreReadout.left = layoutBounds.minX + margin;
    scoreReadout.top = layoutBounds.minY + margin;

    const throttleControl = new ThrottleControlNode(model);
    throttleControl.left = layoutBounds.minX + margin;
    throttleControl.bottom = layoutBounds.maxY - margin;

    const resetAllButton = new ResetAllButton({
      listener: () => {
        this.interruptSubtreeInput();
        model.reset();
        this.reset();
      },
      tandem: providedOptions.tandem.createTandem("resetAllButton"),
    });

    // Play/Pause drives the model directly; only meaningful once the game has started.
    const playPauseButton = new PlayPauseButton(model.isPlayingProperty, {
      radius: 23,
      enabledProperty: model.hasStartedProperty,
      tandem: providedOptions.tandem.createTandem("playPauseButton"),
    });

    const bottomControls = new HBox({
      spacing: 10,
      align: "center",
      children: [playPauseButton, resetAllButton],
      right: layoutBounds.maxX - margin,
      bottom: layoutBounds.maxY - margin,
    });

    const startOverlay = new StartOverlayNode(model, this.playAreaViewBounds, () => model.startGame());

    this.soundView = new LunarLanderSoundView(model);

    this.children = [
      starfield,
      cameraNode,
      messageNode,
      controlPanel,
      scoreReadout,
      throttleControl,
      bottomControls,
      startOverlay,
    ];

    this.addKeyboardControls(model);
  }

  private addKeyboardControls(model: LunarLanderModel): void {
    KeyboardListener.createGlobal(this, {
      keys: ["arrowUp", "arrowDown", "arrowLeft", "arrowRight", "space", "r", "p"],
      fire: (_event, keysPressed) => {
        switch (keysPressed) {
          case "arrowUp":
            model.increaseThrust();
            break;
          case "arrowDown":
            model.decreaseThrust();
            break;
          case "arrowLeft":
            model.tiltLeft();
            break;
          case "arrowRight":
            model.tiltRight();
            break;
          case "space":
            model.toggleFullThrust();
            break;
          case "r":
            this.interruptSubtreeInput();
            model.reset();
            this.reset();
            break;
          case "p":
            if (model.hasStartedProperty.value) {
              model.isPlayingProperty.toggle();
            }
            break;
          default:
            break;
        }
      },
    });
  }

  /**
   * Reposition the camera (the worldNode matrix) so the view tracks the lander.
   *
   * Vertically it zooms toward the spot directly beneath the lander as its
   * clearance drops — wide while high, closing in on the landing site near
   * touchdown, like the Flash original — and zooms back out when the lander
   * climbs past the top of the world, so it never disappears off the top edge.
   *
   * Horizontally it pans so the lander stays centred (the same idea as the zoom,
   * but a translation rather than a scale), clamped so the wider-than-one-screen
   * moon always fills the play area — the view never slides past its edges.
   *
   * The vertical part is a pure scale by z about the focal point f (the surface
   * point under the lander, in base-view pixels): screen.y = f.y + z·(v.y − f.y).
   * z > 1 zooms in (descent), z = 1 is the base view, z < 1 zooms out (ascent).
   * Horizontally the same scale z applies (so zooming out reveals more terrain
   * sideways too); the x-translation c centres the lander's column on-screen.
   */
  private updateCamera(): void {
    const position = this.model.lander.positionProperty.value;
    const surfaceY = this.model.terrain.surfaceY(position.x);
    const altitude = Math.max(0, position.y - surfaceY);

    const f = this.modelViewTransform.modelToViewPosition(new Vector2(position.x, surfaceY));

    // Descent: smoothstep the zoom from 1 (at/above ZOOM_START_ALTITUDE) to ZOOM_MAX (touchdown).
    const t = Math.max(0, Math.min(1, (ZOOM_START_ALTITUDE - altitude) / ZOOM_START_ALTITUDE));
    const eased = t * t * (3 - 2 * t);
    const zIn = 1 + eased * (ZOOM_MAX - 1);

    // Ascent: once the lander would rise above a band near the top edge, zoom out
    // just enough (z < 1) to keep it pinned to that band, anchored on the surface
    // point below it. screen.y = f.y + z·(v.y − f.y); solve for screen.y = targetY.
    const v = this.modelViewTransform.modelToViewPosition(position);
    const targetY = this.playAreaViewBounds.minY + ZOOM_OUT_TOP_FRACTION * this.playAreaViewBounds.height;
    let zOut = 1;
    if (v.y < targetY) {
      zOut = Math.max(ZOOM_OUT_MIN, Math.min(1, (targetY - f.y) / (v.y - f.y)));
    }

    // The two regimes are mutually exclusive (one factor is always 1), so the
    // product is a single scale by either the zoom-in or zoom-out factor.
    const z = zIn * zOut;

    // Horizontal follow. With screen.x(vx) = z·vx + c, centring the lander's
    // column (at base-view x f.x) on the play area gives c = centerX − z·f.x.
    // Clamp c so the terrain's left/right edges never pull inside the play area:
    //   z·leftEdge + c ≤ minX  and  z·rightEdge + c ≥ maxX.
    const leftEdge = this.modelViewTransform.modelToViewX(this.model.terrain.minX);
    const rightEdge = this.modelViewTransform.modelToViewX(this.model.terrain.maxX);
    const cMin = this.playAreaViewBounds.maxX - z * rightEdge;
    const cMax = this.playAreaViewBounds.minX - z * leftEdge;
    const cCentered = this.playAreaViewBounds.centerX - z * f.x;
    const c =
      cMin <= cMax
        ? Math.max(cMin, Math.min(cMax, cCentered))
        : this.playAreaViewBounds.centerX - (z * (leftEdge + rightEdge)) / 2; // terrain narrower than view: centre it

    // Scale about f vertically, translate by c horizontally:
    // [ z 0 c ; 0 z f.y(1−z) ; 0 0 1 ].
    this.worldNode.matrix = Matrix3.rowMajor(z, 0, c, 0, z, f.y * (1 - z), 0, 0, 1);
  }

  public reset(): void {
    this.landerNode.reset();
    this.explosionNode.reset();
  }

  public override step(dt: number): void {
    this.landerNode.step(dt);
    this.explosionNode.step(dt);
    this.soundView.step(dt);
  }
}
