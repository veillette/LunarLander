/**
 * ExplosionNode.ts
 *
 * A brief particle burst shown when the lander crash-lands or hits a boulder.
 * Triggered by model.explosionEmitter; advanced by the view's step(dt).
 */
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Circle, Node } from "scenerystack/scenery";
import LunarLanderColors from "../../LunarLanderColors.js";
import LunarLanderConstants from "../model/LunarLanderConstants.js";
import type { LunarLanderModel } from "../model/LunarLanderModel.js";

const { EXPLOSION_DURATION } = LunarLanderConstants;
const PARTICLE_COUNT = 14;
const MAX_DISTANCE = 38; // px — how far particles fly out
const BASE_RADIUS = 6; // px — initial particle radius

export class ExplosionNode extends Node {
  private readonly particles: Circle[] = [];
  private readonly angles: number[] = [];
  private readonly model: LunarLanderModel;
  private readonly modelViewTransform: ModelViewTransform2;
  private elapsed = 0;
  private active = false;

  public constructor(model: LunarLanderModel, modelViewTransform: ModelViewTransform2) {
    super({ pickable: false, visible: false });
    this.model = model;
    this.modelViewTransform = modelViewTransform;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = new Circle(BASE_RADIUS, { fill: LunarLanderColors.explosionColorProperty });
      this.particles.push(particle);
      this.angles.push((i / PARTICLE_COUNT) * 2 * Math.PI);
      this.addChild(particle);
    }

    model.explosionEmitter.addListener(() => this.start());
  }

  private start(): void {
    this.translation = this.modelViewTransform.modelToViewPosition(this.model.lander.positionProperty.value);
    this.elapsed = 0;
    this.active = true;
    this.visible = true;
  }

  public step(dt: number): void {
    if (!this.active) {
      return;
    }
    this.elapsed += dt;
    const t = Math.min(1, this.elapsed / EXPLOSION_DURATION);
    const distance = t * MAX_DISTANCE;
    for (let i = 0; i < this.particles.length; i++) {
      const angle = this.angles[i] ?? 0;
      const particle = this.particles[i];
      if (particle) {
        particle.x = Math.cos(angle) * distance;
        particle.y = Math.sin(angle) * distance;
        particle.setRadius(Math.max(0.5, (1 - t) * BASE_RADIUS));
        particle.opacity = 1 - t;
      }
    }
    if (t >= 1) {
      this.active = false;
      this.visible = false;
    }
  }

  public reset(): void {
    this.active = false;
    this.visible = false;
    this.elapsed = 0;
  }
}
