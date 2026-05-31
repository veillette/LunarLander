/**
 * Terrain.ts
 *
 * Pure geometry queries over the hand-designed terrain table. Replaces the
 * original Flash pixel `hitTest` with interval/circle math in model space, so
 * the model stays free of any view dependency.
 */
import type { Boulder, TerrainData, TerrainSegment } from "./TerrainData.js";
import TERRAIN_DATA from "./TerrainData.js";

export class Terrain {
  private readonly data: TerrainData;

  public constructor(data: TerrainData = TERRAIN_DATA) {
    this.data = data;
  }

  public get segments(): ReadonlyArray<TerrainSegment> {
    return this.data.segments;
  }

  public get boulders(): ReadonlyArray<Boulder> {
    return this.data.boulders;
  }

  public get minX(): number {
    return this.data.minX;
  }

  public get maxX(): number {
    return this.data.maxX;
  }

  /** A good starting horizontal position — centered above a wide, easy pad. */
  public get startX(): number {
    return this.data.startX;
  }

  private clampX(x: number): number {
    return Math.max(this.data.minX, Math.min(this.data.maxX, x));
  }

  /** Absolute terrain surface elevation (m) at horizontal position x. */
  public surfaceY(x: number): number {
    const cx = this.clampX(x);
    for (const segment of this.data.segments) {
      if (cx >= segment.x0 && cx <= segment.x1) {
        if (segment.kind === "flat") {
          return segment.height;
        }
        const t = segment.x1 === segment.x0 ? 0 : (cx - segment.x0) / (segment.x1 - segment.x0);
        return segment.height0 + t * (segment.height1 - segment.height0);
      }
    }
    return 0;
  }

  /** The scored zone index (1..15) of the flat pad containing x, or 0 if none. */
  public zoneAt(x: number): number {
    for (const segment of this.data.segments) {
      if (segment.kind === "flat" && x >= segment.x0 && x <= segment.x1) {
        return segment.zoneIndex;
      }
    }
    return 0;
  }

  /** The center of a boulder in absolute model coordinates. */
  private boulderCenterY(boulder: Boulder): number {
    return boulder.surface + boulder.radius;
  }

  /**
   * True if a lander of the given collision radius, centered at (x, yAbs),
   * intersects any boulder.
   */
  public boulderHit(x: number, yAbs: number, landerRadius: number): boolean {
    for (const boulder of this.data.boulders) {
      const dx = x - boulder.x;
      const dy = yAbs - this.boulderCenterY(boulder);
      const sum = boulder.radius + landerRadius;
      if (dx * dx + dy * dy <= sum * sum) {
        return true;
      }
    }
    return false;
  }
}
