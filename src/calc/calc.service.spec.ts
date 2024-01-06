import { Test, TestingModule } from "@nestjs/testing";
import { CalcService } from "./calc.service";

describe("CalcService", () => {
  let service: CalcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalcService],
    }).compile();

    service = module.get<CalcService>(CalcService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("calculateBrickQuantity", () => {
    it("should calculate the brick quantity", () => {
      const wallThickness = 5;
      const brickType = 1;
      const wallHeight = 40;
      const wallLength = 3;
      const frameHeight = 2.7;
      const frameWidth = 2;

      const result = service.calculateBrickQuantity(
        wallThickness,
        brickType,
        wallHeight,
        wallLength,
        frameHeight,
        frameWidth,
        false,
      );
      console.log("result: ", result);
      expect(typeof result).toBe("number");
    });
  });

  describe("calculateBrickQuantityByVolume", () => {
    it("should calculate the brick quantity", () => {
      const brickType = 1;
      const bricklayingVolume = 40;

      const result = service.calculateBrickQuantityByVolume(brickType, bricklayingVolume, false);
      console.log("result: ", result);
      expect(typeof result).toBe("number");
    });
  });
});
