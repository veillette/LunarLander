/**
 * LanderNode.ts
 *
 * The lunar module, drawn with vector shapes (themeable via LunarLanderColors).
 * Geometry is in model metres; an inner node is scaled to view pixels and rotated
 * to the lander's tilt angle. A main thrust flame scales with the effective
 * thrust, and brief RCS puffs fire when the lander tilts.
 *
 * Orientation: the sprite is drawn in screen convention (−y is up), so at angle 0
 * the cabin is up and the engine/flame point down. Setting rotation = angle makes
 * a positive tilt lean the lander toward +x, matching aX = thrust·sin(angle)/m.
 */
import { Multilink } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, Node, Path } from "scenerystack/scenery";
import LunarLanderColors from "../../LunarLanderColors.js";
import { CrashState } from "../model/CrashState.js";
import LunarLanderConstants from "../model/LunarLanderConstants.js";
import type { LunarLanderModel } from "../model/LunarLanderModel.js";

const { MAX_THRUST, RCS_PUFF_DURATION } = LunarLanderConstants;

// Geometry (metres, local screen convention: −y up).
const BODY_HALF_WIDTH = 3.5;
const BODY_TOP_Y = -2;
const BODY_BOTTOM_Y = 1;
const BODY_CHAMFER = 1;
const BELL_TOP_Y = 1;
const BELL_BOTTOM_Y = 3;
const FLAME_LENGTH = 6;

export class LanderNode extends Node {
  private readonly leftPuff: Node;
  private readonly rightPuff: Node;
  private leftPuffTimer = 0;
  private rightPuffTimer = 0;

  public constructor(model: LunarLanderModel, modelViewTransform: ModelViewTransform2) {
    super({ pickable: false });

    const graphic = new Node();
    graphic.setScaleMagnitude(modelViewTransform.modelToViewDeltaX(1));
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

    // Position follows the lander; rotation follows the tilt angle.
    model.lander.positionProperty.link((position) => {
      this.translation = modelViewTransform.modelToViewPosition(position);
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
    const w = BODY_HALF_WIDTH;
    const c = BODY_CHAMFER;

    // Octagonal descent stage.
    const body = new Shape();
    body.moveTo(-w + c, BODY_TOP_Y);
    body.lineTo(w - c, BODY_TOP_Y);
    body.lineTo(w, BODY_TOP_Y + c);
    body.lineTo(w, BODY_BOTTOM_Y - c);
    body.lineTo(w - c, BODY_BOTTOM_Y);
    body.lineTo(-w + c, BODY_BOTTOM_Y);
    body.lineTo(-w, BODY_BOTTOM_Y - c);
    body.lineTo(-w, BODY_TOP_Y + c);
    body.close();
    node.addChild(
      new Path(body, {
        fill: LunarLanderColors.landerBodyColorProperty,
        stroke: LunarLanderColors.landerAccentColorProperty,
        lineWidth: 0.25,
      }),
    );

    // Ascent stage / cabin.
    const cabin = new Shape().roundRect(-2.2, -5, 4.4, 3, 0.8, 0.8);
    node.addChild(new Path(cabin, { fill: LunarLanderColors.landerBodyColorProperty }));
    // A little window.
    node.addChild(new Circle(0.7, { x: 0, y: -3.4, fill: LunarLanderColors.landerAccentColorProperty }));

    // Engine bell.
    const bell = new Shape();
    bell.moveTo(-0.9, BELL_TOP_Y);
    bell.lineTo(0.9, BELL_TOP_Y);
    bell.lineTo(1.7, BELL_BOTTOM_Y);
    bell.lineTo(-1.7, BELL_BOTTOM_Y);
    bell.close();
    node.addChild(new Path(bell, { fill: LunarLanderColors.landerEngineColorProperty }));

    // Legs (left, right, center) with foot pads.
    const legs = new Shape();
    legs.moveTo(-2.8, 0.5).lineTo(-5.5, 4);
    legs.moveTo(2.8, 0.5).lineTo(5.5, 4);
    legs.moveTo(0, BODY_BOTTOM_Y).lineTo(0, 4.6);
    node.addChild(new Path(legs, { stroke: LunarLanderColors.landerLegColorProperty, lineWidth: 0.5 }));
    node.addChild(new Circle(0.5, { x: -5.5, y: 4, fill: LunarLanderColors.landerLegColorProperty }));
    node.addChild(new Circle(0.5, { x: 5.5, y: 4, fill: LunarLanderColors.landerLegColorProperty }));
    node.addChild(new Circle(0.5, { x: 0, y: 4.6, fill: LunarLanderColors.landerLegColorProperty }));

    return node;
  }

  private static buildFlame(): Node {
    const node = new Node({ visible: false });
    const outer = new Shape();
    outer.moveTo(-1.6, 0).lineTo(1.6, 0).lineTo(0, FLAME_LENGTH).close();
    node.addChild(new Path(outer, { fill: LunarLanderColors.flameColorProperty }));
    const inner = new Shape();
    inner
      .moveTo(-0.8, 0)
      .lineTo(0.8, 0)
      .lineTo(0, FLAME_LENGTH * 0.6)
      .close();
    node.addChild(new Path(inner, { fill: LunarLanderColors.flameCoreColorProperty }));
    return node;
  }

  private static buildPuff(direction: number): Node {
    const sign = direction > 0 ? 1 : -1;
    const baseX = sign * (BODY_HALF_WIDTH + 0.2);
    const shape = new Shape();
    shape
      .moveTo(baseX, -1)
      .lineTo(baseX, 0.2)
      .lineTo(baseX + sign * 2.2, -0.4)
      .close();
    return new Path(shape, { fill: LunarLanderColors.rcsPuffColorProperty, visible: false });
  }
}
