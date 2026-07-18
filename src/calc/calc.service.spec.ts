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

  it("calculates by volume without seam for 1NF", () => {
    const result = service.calculateBrickQuantityByVolume(1, 40, false);
    expect(result.quantity).toBe(20513);
    expect(result.quantityWithReserve).toBe(Math.ceil(20513 * 1.05));
    expect(result.reservePercent).toBe(5);
    expect(result.pack).toBe(297);
    expect(result.pallets).toBe(Math.ceil(result.quantityWithReserve / 297));
  });

  it("supports 2.1NF brick type", () => {
    const result = service.calculateBrickQuantityByVolume(3, 1, false);
    expect(result.quantity).toBeGreaterThan(0);
    expect(result.brickDescription).toContain("2,1НФ");
    expect(result.pack).toBe(189);
  });

  it("clamps openings larger than wall to zero bricks", () => {
    const result = service.calculateBrickQuantityByParameters(1, 1, 2, 2, 10, 10, true);
    expect(result.quantity).toBe(0);
    expect(result.quantityWithReserve).toBe(0);
    expect(result.pallets).toBe(0);
  });

  it("applies mortar seam on all three axes", () => {
    const withoutSeam = service.calculateBrickQuantityByVolume(1, 1, false);
    const withSeam = service.calculateBrickQuantityByVolume(1, 1, true);
    expect(withSeam.quantity).toBeLessThan(withoutSeam.quantity);
    expect(withSeam.quantity).toBe(395);
  });
});
