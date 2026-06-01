/**
 * LanderNode.ts
 *
 * The lunar module, drawn with vector shapes (themeable via LunarLanderColors).
 * Geometry is in model metres; an inner node is scaled to view pixels and rotated
 * to the lander's tilt angle. A main thrust flame scales with the effective
 * thrust, and brief RCS puffs fire when the lander tilts.
 *
 * The silhouette is the iconic Apollo LM: a gold-foil descent stage on splayed
 * A-frame legs, a silver ascent cabin with a triangular window, an engine bell,
 * and a top antenna.
 *
 * Orientation: the sprite is drawn in screen convention (−y is up), so at angle 0
 * the cabin is up and the engine/flame point down. Setting rotation = angle makes
 * a positive tilt lean the lander toward +x, matching aX = thrust·sin(angle)/m.
 *
 * Anchoring: the model position is the lander's ground-contact point (where the
 * model rests it on the surface at touchdown). The sprite's body origin sits at
 * its centre, with the legs splayed LEG_CONTACT_OFFSET metres below, so the node
 * is shifted up by that offset — placing the foot pads, not the body centre, on
 * the model position. This is why the legs rest ON the surface instead of below it.
 */
import { Multilink } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, LinearGradient, Node, Path } from "scenerystack/scenery";
import LunarLanderColors from "../../LunarLanderColors.js";
import { CrashState } from "../model/CrashState.js";
import LunarLanderConstants from "../model/LunarLanderConstants.js";
import type { LunarLanderModel } from "../model/LunarLanderModel.js";

const { MAX_THRUST, RCS_PUFF_DURATION } = LunarLanderConstants;

// Geometry (metres, local screen convention: −y up).
const DESCENT_HALF_WIDTH = 4.2; // gold-foil lower stage
const DESCENT_TOP_Y = -1;
const DESCENT_BOTTOM_Y = 2.2;
const DESCENT_CHAMFER = 1.3;
const CABIN_HALF_WIDTH = 2.6; // silver ascent stage
const CABIN_TOP_Y = -5.2;
const BELL_BOTTOM_Y = 4.2;
const FLAME_LENGTH = 6.5;
const LEG_FOOT_Y = 4.7; // foot-pad centre — all three legs rest at this local y so the lander sits flush
const FOOT_PAD_RX = 0.85;
const FOOT_PAD_RY = 0.4;

export class LanderNode extends Node {
  // Model-metre distance from the body origin (the model position) down to the
  // foot-pad bottom — the ground-contact line. The sprite is shifted up by this
  // so the landing legs rest ON the surface rather than sinking below it.
  public static readonly LEG_CONTACT_OFFSET = LEG_FOOT_Y + FOOT_PAD_RY;

  private readonly leftPuff: Node;
  private readonly rightPuff: Node;
  private leftPuffTimer = 0;
  private rightPuffTimer = 0;

  public constructor(model: LunarLanderModel, modelViewTransform: ModelViewTransform2) {
    super({ pickable: false });

    const metersToView = modelViewTransform.modelToViewDeltaX(1);
    const graphic = new Node();
    graphic.setScaleMagnitude(metersToView);
    this.addChild(graphic);

    // ── Body + flame (children of graphic so they rotate with the lander) ────
    graphic.addChild(LanderNode.buildBody());
    const flame = LanderNode.buildFlame();
    flame.translation = flame.translation.plusXY(0, BELL_BOTTOM_Y);
    graphic.addChild(flame);

    this.leftPuff = LanderNode.buildPuff(-1);
    this.rightPuff = LanderNode.buildPuff(1);
    graphic.addChild(this.leftPuff);
    graphic.addChild(this.rightPuff);

    // Position follows the lander; rotation follows the tilt angle. The node is
    // shifted up by the leg reach so the foot pads (not the body centre) sit on
    // the model position — i.e. the legs rest on the surface at touchdown.
    const contactOffsetView = LanderNode.LEG_CONTACT_OFFSET * metersToView;
    model.lander.positionProperty.link((position) => {
      this.translation = modelViewTransform.modelToViewPosition(position).plusXY(0, -contactOffsetView);
    });
    model.lander.angleProperty.link((angle) => {
      graphic.rotation = angle;
    });

    // Flame length tracks the effective thrust fraction. Skip the scale update
    // when there is no flame: a zero y-scale produces a degenerate
    // (non-invertible) transform matrix, and the flame is hidden anyway.
    Multilink.multilink([model.lander.thrustProperty, model.lander.remainingFuelProperty], (thrust, fuel) => {
      const fraction = fuel > 0 ? thrust / MAX_THRUST : 0;
      flame.visible = fraction > 0.01;
      if (flame.visible) {
        flame.setScaleMagnitude(1, fraction);
      }
    });

    // Hide the lander once it has crash-landed (the explosion takes over).
    model.crashStateProperty.link((state) => {
      this.visible = state !== CrashState.CRASH_LANDED;
    });

    model.tiltEmitter.addListener((direction) => this.pulseRcs(direction));
  }

  /** Fire the side-thruster puff for a brief moment. direction > 0 → right thruster. */
  public pulseRcs(direction: number): void {
    if (direction > 0) {
      this.rightPuffTimer = RCS_PUFF_DURATION;
    } else {
      this.leftPuffTimer = RCS_PUFF_DURATION;
    }
  }

  public step(dt: number): void {
    if (this.leftPuffTimer > 0) {
      this.leftPuffTimer -= dt;
    }
    if (this.rightPuffTimer > 0) {
      this.rightPuffTimer -= dt;
    }
    this.leftPuff.visible = this.leftPuffTimer > 0;
    this.rightPuff.visible = this.rightPuffTimer > 0;
  }

  public reset(): void {
    this.leftPuffTimer = 0;
    this.rightPuffTimer = 0;
    this.leftPuff.visible = false;
    this.rightPuff.visible = false;
  }

  // ── Geometry builders ───────────────────────────────────────────────────────

  private static buildBody(): Node {
    const node = new Node();

    // Splayed A-frame landing legs (drawn first, behind the stages).
    node.addChild(LanderNode.buildLeg(-1));
    node.addChild(LanderNode.buildLeg(1));
    node.addChild(LanderNode.buildCenterLeg());

    // Engine bell below the descent stage.
    const bell = new Shape();
    bell.moveTo(-0.95, DESCENT_BOTTOM_Y - 0.1);
    bell.lineTo(0.95, DESCENT_BOTTOM_Y - 0.1);
    bell.lineTo(1.85, BELL_BOTTOM_Y);
    bell.quadraticCurveTo(0, BELL_BOTTOM_Y + 0.7, -1.85, BELL_BOTTOM_Y);
    bell.close();
    node.addChild(new Path(bell, { fill: LunarLanderColors.landerEngineColorProperty }));

    // Gold-foil descent stage (octagon) with a sunlit-to-shadow gradient.
    const w = DESCENT_HALF_WIDTH;
    const c = DESCENT_CHAMFER;
    const descent = new Shape();
    descent.moveTo(-w + c, DESCENT_TOP_Y);
    descent.lineTo(w - c, DESCENT_TOP_Y);
    descent.lineTo(w, DESCENT_TOP_Y + c);
    descent.lineTo(w, DESCENT_BOTTOM_Y - c);
    descent.lineTo(w - c, DESCENT_BOTTOM_Y);
    descent.lineTo(-w + c, DESCENT_BOTTOM_Y);
    descent.lineTo(-w, DESCENT_BOTTOM_Y - c);
    descent.lineTo(-w, DESCENT_TOP_Y + c);
    descent.close();
    const foil = new LinearGradient(0, DESCENT_TOP_Y, 0, DESCENT_BOTTOM_Y);
    foil.addColorStop(0, LunarLanderColors.landerFoilColorProperty);
    foil.addColorStop(1, LunarLanderColors.landerFoilShadeColorProperty);
    node.addChild(
      new Path(descent, { fill: foil, stroke: LunarLanderColors.landerFoilShadeColorProperty, lineWidth: 0.18 }),
    );
    // Foil panel seams.
    const seams = new Shape();
    seams.moveTo(-w + 0.4, DESCENT_TOP_Y + 1).lineTo(w - 0.4, DESCENT_TOP_Y + 1);
    seams.moveTo(-1.4, DESCENT_TOP_Y).lineTo(-1.4, DESCENT_BOTTOM_Y);
    seams.moveTo(1.4, DESCENT_TOP_Y).lineTo(1.4, DESCENT_BOTTOM_Y);
    node.addChild(new Path(seams, { stroke: LunarLanderColors.landerFoilShadeColorProperty, lineWidth: 0.16 }));

    // Silver ascent stage (cabin) with its own top-lit gradient.
    const cabin = new Shape().roundRect(
      -CABIN_HALF_WIDTH,
      CABIN_TOP_Y,
      CABIN_HALF_WIDTH * 2,
      DESCENT_TOP_Y - CABIN_TOP_Y + 0.2,
      0.9,
      0.9,
    );
    const silver = new LinearGradient(0, CABIN_TOP_Y, 0, DESCENT_TOP_Y);
    silver.addColorStop(0, LunarLanderColors.landerHighlightColorProperty);
    silver.addColorStop(0.55, LunarLanderColors.landerBodyColorProperty);
    silver.addColorStop(1, LunarLanderColors.landerShadeColorProperty);
    node.addChild(
      new Path(cabin, { fill: silver, stroke: LunarLanderColors.landerAccentColorProperty, lineWidth: 0.18 }),
    );

    // RCS thruster quads on the cabin shoulders (small nubs).
    for (const sign of [-1, 1]) {
      const quad = new Shape().rect(sign * CABIN_HALF_WIDTH, CABIN_TOP_Y + 1.4, sign * 0.45, 0.7);
      node.addChild(new Path(quad, { fill: LunarLanderColors.landerShadeColorProperty }));
    }

    // Triangular cabin window (dark glass with a lit frame).
    const windowShape = new Shape();
    windowShape.moveTo(-1.05, CABIN_TOP_Y + 1.2);
    windowShape.lineTo(1.05, CABIN_TOP_Y + 1.2);
    windowShape.lineTo(0, CABIN_TOP_Y + 2.7);
    windowShape.close();
    node.addChild(
      new Path(windowShape, {
        fill: LunarLanderColors.landerWindowColorProperty,
        stroke: LunarLanderColors.landerAccentColorProperty,
        lineWidth: 0.2,
      }),
    );

    // Docking ring + antenna on top.
    node.addChild(
      new Path(new Shape().rect(-0.9, CABIN_TOP_Y - 0.5, 1.8, 0.5), {
        fill: LunarLanderColors.landerShadeColorProperty,
      }),
    );
    node.addChild(
      new Path(new Shape().moveTo(0, CABIN_TOP_Y - 0.5).lineTo(0, CABIN_TOP_Y - 1.8), {
        stroke: LunarLanderColors.landerAccentColorProperty,
        lineWidth: 0.18,
      }),
    );
    node.addChild(
      new Circle(0.28, { x: 0, y: CABIN_TOP_Y - 1.9, fill: LunarLanderColors.landerHighlightColorProperty }),
    );

    return node;
  }

  /** One splayed A-frame side leg. sign < 0 is the left leg. */
  private static buildLeg(sign: number): Node {
    const node = new Node();
    const footX = sign * 6.0;
    const footY = LEG_FOOT_Y;
    const struts = new Shape();
    struts.moveTo(sign * (DESCENT_HALF_WIDTH - 0.6), DESCENT_TOP_Y + 0.6).lineTo(footX, footY);
    struts.moveTo(sign * (DESCENT_HALF_WIDTH - 0.4), DESCENT_BOTTOM_Y - 0.4).lineTo(footX, footY);
    node.addChild(new Path(struts, { stroke: LunarLanderColors.landerLegColorProperty, lineWidth: 0.42 }));
    // Foot pad.
    node.addChild(
      new Path(new Shape().ellipse(footX, footY, FOOT_PAD_RX, FOOT_PAD_RY, 0), {
        fill: LunarLanderColors.landerLegColorProperty,
      }),
    );
    return node;
  }

  /** The near (front) leg, drawn straight down the centre. Its foot shares the
   * side legs' contact level (LEG_FOOT_Y) so all three pads rest on the surface. */
  private static buildCenterLeg(): Node {
    const node = new Node();
    node.addChild(
      new Path(new Shape().moveTo(0, DESCENT_BOTTOM_Y - 0.2).lineTo(0, LEG_FOOT_Y - 0.1), {
        stroke: LunarLanderColors.landerLegColorProperty,
        lineWidth: 0.42,
      }),
    );
    node.addChild(
      new Path(new Shape().ellipse(0, LEG_FOOT_Y, FOOT_PAD_RX, FOOT_PAD_RY, 0), {
        fill: LunarLanderColors.landerLegColorProperty,
      }),
    );
    return node;
  }

  private static buildFlame(): Node {
    const node = new Node({ visible: false });
    // Outer plume.
    const outer = new Shape();
    outer.moveTo(-1.7, 0).quadraticCurveTo(-0.7, FLAME_LENGTH * 0.7, 0, FLAME_LENGTH);
    outer.quadraticCurveTo(0.7, FLAME_LENGTH * 0.7, 1.7, 0).close();
    node.addChild(new Path(outer, { fill: LunarLanderColors.flameColorProperty }));
    // Mid plume.
    const midLen = FLAME_LENGTH * 0.72;
    const mid = new Shape();
    mid.moveTo(-1.05, 0).quadraticCurveTo(-0.4, midLen * 0.7, 0, midLen);
    mid.quadraticCurveTo(0.4, midLen * 0.7, 1.05, 0).close();
    node.addChild(new Path(mid, { fill: LunarLanderColors.flameMidColorProperty }));
    // Hot core.
    const coreLen = FLAME_LENGTH * 0.42;
    const core = new Shape();
    core.moveTo(-0.5, 0).quadraticCurveTo(-0.2, coreLen * 0.7, 0, coreLen);
    core.quadraticCurveTo(0.2, coreLen * 0.7, 0.5, 0).close();
    node.addChild(new Path(core, { fill: LunarLanderColors.flameCoreColorProperty }));
    return node;
  }

  private static buildPuff(direction: number): Node {
    const sign = direction > 0 ? 1 : -1;
    const baseX = sign * (CABIN_HALF_WIDTH + 0.5);
    const baseY = CABIN_TOP_Y + 1.5;
    const shape = new Shape();
    shape
      .moveTo(baseX, baseY - 0.6)
      .lineTo(baseX, baseY + 0.6)
      .lineTo(baseX + sign * 2.2, baseY)
      .close();
    return new Path(shape, { fill: LunarLanderColors.rcsPuffColorProperty, visible: false });
  }
}
