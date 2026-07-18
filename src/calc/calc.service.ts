import { BadRequestException, Injectable } from "@nestjs/common";

interface Brick {
  size: { length: number; width: number; height: number };
  description: string;
  pack: number;
}

interface WallThickness {
  width: number;
  description: string;
}

export interface CalcResult {
  quantity: number;
  quantityWithReserve: number;
  reservePercent: number;
  pallets: number;
  pack: number;
  brickDescription: string;
}

@Injectable()
export class CalcService {
  private brickMap: Map<number, Brick>;
  private wallThicknessMap: Map<number, WallThickness>;
  private readonly reservePercent = 5;
  private readonly mortarSeamMm = 10;

  constructor() {
    this.brickMap = new Map<number, Brick>();
    this.wallThicknessMap = new Map<number, WallThickness>();
    this.initializeBrickMap();
    this.initializeWallThicknessMap();
  }

  calculateBrickQuantityByParameters(
    wallThicknessType: number,
    brickType: number,
    wallHeight: number,
    wallLength: number,
    frameHeight: number,
    frameWidth: number,
    mortarSeamEnabled: boolean,
  ): CalcResult {
    const wallThickness = this.wallThicknessMap.get(wallThicknessType);
    const brick = this.brickMap.get(brickType);

    if (!wallThickness || !brick) {
      throw new BadRequestException(
        "brickType: 1 (1НФ), 2 (1,4НФ) или 3 (2,1НФ); wallThickness: от 1 до 5",
      );
    }

    const wallArea = wallHeight * wallLength;
    const frameArea = Math.max(0, frameHeight) * Math.max(0, frameWidth);
    const brickworkArea = Math.max(0, wallArea - frameArea);
    const bricklayingVolume = (brickworkArea * wallThickness.width) / 1000;

    return this.buildResult(brick, bricklayingVolume, mortarSeamEnabled);
  }

  calculateBrickQuantityByVolume(
    brickType: number,
    bricklayingVolume: number,
    mortarSeamEnabled: boolean,
  ): CalcResult {
    const brick = this.brickMap.get(brickType);

    if (!brick) {
      throw new BadRequestException("brickType: 1 (1НФ), 2 (1,4НФ) или 3 (2,1НФ)");
    }

    return this.buildResult(brick, Math.max(0, bricklayingVolume), mortarSeamEnabled);
  }

  private buildResult(
    brick: Brick,
    bricklayingVolume: number,
    mortarSeamEnabled: boolean,
  ): CalcResult {
    const seam = mortarSeamEnabled ? this.mortarSeamMm : 0;
    const brickVolume =
      ((brick.size.length + seam) * (brick.size.width + seam) * (brick.size.height + seam)) / 1e9;

    const quantity =
      brickVolume === 0 || bricklayingVolume === 0 ? 0 : Math.ceil(bricklayingVolume / brickVolume);

    const quantityWithReserve = Math.ceil(quantity * (1 + this.reservePercent / 100));
    const pallets = brick.pack > 0 ? Math.ceil(quantityWithReserve / brick.pack) : 0;

    return {
      quantity,
      quantityWithReserve,
      reservePercent: this.reservePercent,
      pallets,
      pack: brick.pack,
      brickDescription: brick.description,
    };
  }

  private initializeBrickMap(): void {
    this.brickMap.set(1, {
      size: { length: 250, width: 120, height: 65 },
      description: "1НФ одинарный (250×120×65)",
      pack: 297,
    });

    this.brickMap.set(2, {
      size: { length: 250, width: 120, height: 88 },
      description: "1,4НФ утолщённый (250×120×88)",
      pack: 270,
    });

    this.brickMap.set(3, {
      size: { length: 250, width: 120, height: 140 },
      description: "2,1НФ (250×120×140)",
      pack: 189,
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
