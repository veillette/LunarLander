/**
 * VectorsNode.ts
 *
 * Velocity and acceleration arrows anchored at the lander. Kept separate from
 * LanderNode so they don't inherit the lander's rotation. Toggled by the
 * "Vectors" checkbox (model.showVectorsProperty).
 */
import { Multilink } from "scenerystack/axon";
import type { Vector2 } from "scenerystack/dot";
import type { ModelViewTransform2 } from "scenerystack/phetcommon";
import { Node } from "scenerystack/scenery";
import { ArrowNode } from "scenerystack/scenery-phet";
import LunarLanderColors from "../../LunarLanderColors.js";
import type { LunarLanderModel } from "../model/LunarLanderModel.js";

const ARROW_OPTIONS = { headWidth: 12, headHeight: 12, tailWidth: 4, stroke: null } as const;

// Visual scale factors converting model magnitudes to a readable arrow length.
const VELOCITY_VECTOR_SCALE = 1.4; // seconds (displacement = v · scale)
const ACCELERATION_VECTOR_SCALE = 6; // seconds² (displacement = a · scale)

export class VectorsNode extends Node {
  public constructor(model: LunarLanderModel, modelViewTransform: ModelViewTransform2) {
    super({ pickable: false, visibleProperty: model.showVectorsProperty });

    const lander = model.lander;

    const velocityArrow = new ArrowNode(0, 0, 0, 0, {
      ...ARROW_OPTIONS,
      fill: LunarLanderColors.velocityVectorColorProperty,
    });
    const accelerationArrow = new ArrowNode(0, 0, 0, 0, {
      ...ARROW_OPTIONS,
      fill: LunarLanderColors.accelerationVectorColorProperty,
    });
    this.children = [accelerationArrow, velocityArrow];

    const updateArrow = (arrow: ArrowNode, position: Vector2, vector: Vector2, scale: number): void => {
      const tail = modelViewTransform.modelToViewPosition(position);
      const tip = tail.plus(modelViewTransform.modelToViewDelta(vector.timesScalar(scale)));
      arrow.setTailAndTip(tail.x, tail.y, tip.x, tip.y);
    };

    Multilink.multilink([lander.positionProperty, lander.velocityProperty], (position, velocity) => {
      updateArrow(velocityArrow, position, velocity, VELOCITY_VECTOR_SCALE);
    });
    Multilink.multilink([lander.positionProperty, lander.accelerationProperty], (position, acceleration) => {
      updateArrow(accelerationArrow, position, acceleration, ACCELERATION_VECTOR_SCALE);
    });
  }
}
