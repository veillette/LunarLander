/**
 * LunarLanderScreenView.ts
 *
 * Top-level view: builds the (uniform-scale, inverted-Y) model-view transform,
 * assembles the scene (starfield, terrain, lander, vectors), the instrument
 * panel, score, on-screen throttle controls, and the global keyboard controls.
 * Overlays and sound are layered on in later steps.
 */
import { DerivedProperty } from "scenerystack/axon";
import { Bounds2, Matrix3, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { ModelViewTransform2 } from "scenerystack/phetcommon";
import { KeyboardListener, Node } from "scenerystack/scenery";
import { PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import type { Dialog, ScreenViewOptions } from "scenerystack/sim";
import { ScreenView } from "scenerystack/sim";
import { TextPushButton } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import { StringManager } from "../../i18n/StringManager.js";
import LunarLanderConstants from "../model/LunarLanderConstants.js";
import type { LunarLanderModel } from "../model/LunarLanderModel.js";
import { ControlPanel } from "./ControlPanel.js";
import { ExplosionNode } from "./ExplosionNode.js";
import { createHelpDialog } from "./HelpDialog.js";
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

const { SCREEN_VIEW_MARGIN, CONTROL_PANEL_WIDTH, MODEL_MIN_Y, MODEL_MAX_ALTITUDE, ZOOM_START_ALTITUDE, ZOOM_MAX } =
  LunarLanderConstants;

export class LunarLanderScreenView extends ScreenView {
  protected readonly modelViewTransform: ModelViewTransform2;
  protected readonly playAreaViewBounds: Bounds2;
  protected readonly model: LunarLanderModel;
  // Holds the world-space scene (terrain, vectors, lander, explosion); its matrix
  // is the camera that zooms toward the landing site as the lander descends.
  private readonly worldNode: Node;
  private readonly landerNode: LanderNode;
  private readonly explosionNode: ExplosionNode;
  private readonly helpDialog: Dialog;
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

    // Uniform-scale inverted-Y mapping: fit the (terrain-width × altitude) model
    // rectangle into the play area, centered, preserving aspect ratio.
    const modelBounds = new Bounds2(model.terrain.minX, MODEL_MIN_Y, model.terrain.maxX, MODEL_MAX_ALTITUDE);
    const scale = Math.min(playW / modelBounds.width, playH / modelBounds.height);
    const viewW = modelBounds.width * scale;
    const viewH = modelBounds.height * scale;
    const vx = playLeft + (playW - viewW) / 2;
    const vy = playTop + (playH - viewH) / 2;
    this.playAreaViewBounds = new Bounds2(vx, vy, vx + viewW, vy + viewH);
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
      right: layoutBounds.maxX - margin,
      bottom: layoutBounds.maxY - margin,
      tandem: providedOptions.tandem.createTandem("resetAllButton"),
    });

    // Help/Pause: pause and open the help dialog; closing it (or pressing again) resumes.
    this.helpDialog = createHelpDialog(() => {
      if (model.hasStartedProperty.value) {
        model.isPlayingProperty.value = true;
      }
    });
    const controls = StringManager.getInstance().getControlStrings();
    const helpPauseLabel = new DerivedProperty(
      [model.isPlayingProperty, model.hasStartedProperty, controls.helpStringProperty, controls.unpauseStringProperty],
      (playing, started, help, unpause) => (!started || playing ? help : unpause),
    );
    const helpPauseButton = new TextPushButton(helpPauseLabel, {
      font: new PhetFont(14),
      baseColor: "#c8c8d0",
      listener: () => {
        if (model.isPlayingProperty.value) {
          model.isPlayingProperty.value = false;
          this.helpDialog.show();
        } else if (this.helpDialog.isShowingProperty.value) {
          this.helpDialog.hide();
        } else if (model.hasStartedProperty.value) {
          model.isPlayingProperty.value = true;
        }
      },
    });
    helpPauseButton.right = resetAllButton.left - margin;
    helpPauseButton.centerY = resetAllButton.centerY;

    const startOverlay = new StartOverlayNode(model, this.playAreaViewBounds, () => model.startGame());

    this.soundView = new LunarLanderSoundView(model);

    this.children = [
      starfield,
      cameraNode,
      messageNode,
      controlPanel,
      scoreReadout,
      throttleControl,
      resetAllButton,
      helpPauseButton,
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
   * Reposition the camera (the worldNode matrix) so the view zooms toward the
   * spot directly beneath the lander as its clearance drops — wide while high,
   * closing in on the landing site near touchdown, like the Flash original.
   *
   * The transform is a pure scale by z about the focal point f (the surface
   * point under the lander, in base-view pixels): screen = f + z·(v − f). At
   * z = 1 this is the identity, so the wide view is recovered exactly up high.
   */
  private updateCamera(): void {
    const position = this.model.lander.positionProperty.value;
    const surfaceY = this.model.terrain.surfaceY(position.x);
    const altitude = Math.max(0, position.y - surfaceY);

    // Smoothstep the zoom from 1 (at/above ZOOM_START_ALTITUDE) to ZOOM_MAX (touchdown).
    const t = Math.max(0, Math.min(1, (ZOOM_START_ALTITUDE - altitude) / ZOOM_START_ALTITUDE));
    const eased = t * t * (3 - 2 * t);
    const z = 1 + eased * (ZOOM_MAX - 1);

    const f = this.modelViewTransform.modelToViewPosition(new Vector2(position.x, surfaceY));
    // Scale about f: [ z 0 f.x(1−z) ; 0 z f.y(1−z) ; 0 0 1 ].
    this.worldNode.matrix = Matrix3.rowMajor(z, 0, f.x * (1 - z), 0, z, f.y * (1 - z), 0, 0, 1);
  }

  public reset(): void {
    if (this.helpDialog.isShowingProperty.value) {
      this.helpDialog.hide();
    }
    this.landerNode.reset();
    this.explosionNode.reset();
  }

  public override step(dt: number): void {
    this.landerNode.step(dt);
    this.explosionNode.step(dt);
    this.soundView.step(dt);
  }
}
