import { Injectable } from "@nestjs/common";

export type BrickType = 1 | 2;
export type WallThicknessType = 1 | 2 | 3 | 4 | 5;

interface Brick {
  size: { length: number; width: number; height: number };
  description: string;
}

interface WallThickness {
  width: number;
  description: string;
}

@Injectable()
export class CalcService {
  private brickMap: Map<BrickType, Brick>;
  private wallThicknessMap: Map<WallThicknessType, WallThickness>;

  constructor() {
    this.brickMap = new Map<BrickType, Brick>();
    this.wallThicknessMap = new Map<WallThicknessType, WallThickness>();
    this.initializeBrickMap();
    this.initializeWallThicknessMap();
  }

  calculateBrickQuantityByParameters(
    wallThicknessType: WallThicknessType,
    brickType: BrickType,
    wallHeight: number,
    wallLength: number,
    frameHeight: number,
    frameWidth: number,
    mortarSeamEnabled: boolean,
  ): number {
    const wallThickness = this.wallThicknessMap.get(wallThicknessType);
    const brick = this.brickMap.get(brickType);
    let mortarSeamWidth = 0;
    if (mortarSeamEnabled) mortarSeamWidth = 10;

    if (!wallThickness || !brick) {
      console.error("Invalid wall thickness or brick type.");
      return 0;
    }

    const wallArea = wallHeight * wallLength;
    const frameArea = frameHeight * frameWidth;
    const brickworkArea = wallArea - frameArea;
    const bricklayingVolume = parseFloat(((brickworkArea * wallThickness.width) / 1000).toFixed(2));
    const brickVolume =
      ((brick.size.length + mortarSeamWidth) *
        brick.size.width *
        (brick.size.height + mortarSeamWidth)) /
      1e9;

    return brickVolume === 0 ? 0 : Math.ceil(bricklayingVolume / brickVolume);
  }

  calculateBrickQuantityByVolume(
    brickType: BrickType,
    bricklayingVolume: number,
    mortarSeamEnabled: boolean,
  ): number {
    const brick = this.brickMap.get(brickType);
    let mortarSeamWidth = 0;
    if (mortarSeamEnabled) mortarSeamWidth = 10;

    if (!brick) {
      console.error("Invalid brick type.");
      return 0;
    }
    const brickVolume =
      ((brick.size.length + mortarSeamWidth) *
        brick.size.width *
        (brick.size.height + mortarSeamWidth)) /
      1e9;

    return brickVolume === 0 ? 0 : Math.ceil(bricklayingVolume / brickVolume);
  }

  private initializeBrickMap(): void {
    this.brickMap.set(1, {
      size: { length: 250, width: 120, height: 65 },
      description: "Одинарный (250×120×65)",
    });

    this.brickMap.set(2, {
      size: { length: 250, width: 120, height: 88 },
      description: "Утолщенный (250×120×88)",
    });
  }

  private initializeWallThicknessMap(): void {
    this.wallThicknessMap.set(1, {
      width: 120,
      description: "Кладка в 0.5 кирпича (толщина 120мм)",
    });
    this.wallThicknessMap.set(2, {
      width: 250,
      description: "Кладка в 1 кирпич (толщина 250мм)",
    });
    this.wallThicknessMap.set(3, {
      width: 380,
      description: "Кладка в 1.5 кирпича (толщина 380мм)",
    });
    this.wallThicknessMap.set(4, {
      width: 510,
      description: "Кладка в 2 кирпича (толщина 510мм)",
    });
    this.wallThicknessMap.set(5, {
      width: 640,
      description: "Кладка в 2.5 кирпича (толщина 640мм)",
    });
  }
}
