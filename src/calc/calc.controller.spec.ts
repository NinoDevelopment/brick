import { Test, TestingModule } from "@nestjs/testing";
import { CalcController } from "./calc.controller";
import { CalcService } from "./calc.service";

describe("CalcController", () => {
  let controller: CalcController;
  let service: CalcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CalcController],
      providers: [CalcService],
    }).compile();

    controller = module.get<CalcController>(CalcController);
    service = module.get<CalcService>(CalcService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should calculate brick quantity by volume", () => {
    const brickType = 1;
    const bricklayingVolume = 40;
    const mortarSeamEnabled = false;

    const calculateBrickQuantityByVolumeSpy = jest.spyOn(service, "calculateBrickQuantityByVolume");
    const result = controller.calculateBrickQuantityByVolume({
      brickType,
      bricklayingVolume,
      mortarSeamEnabled,
    });

    expect(calculateBrickQuantityByVolumeSpy).toHaveBeenCalledWith(
      brickType,
      bricklayingVolume,
      mortarSeamEnabled,
    );

    expect(result.quantity).toBe(20513);
    expect(result.quantityWithReserve).toBe(Math.ceil(20513 * 1.05));
  });
});
