"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateInventoryLogDto = exports.InventoryType = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var InventoryType;
(function (InventoryType) {
    InventoryType["STOCK_IN"] = "STOCK_IN";
    InventoryType["STOCK_OUT"] = "STOCK_OUT";
    InventoryType["ADJUSTMENT"] = "ADJUSTMENT";
})(InventoryType || (exports.InventoryType = InventoryType = {}));
class CreateInventoryLogDto {
    type;
    quantity;
    note;
    reference;
    productId;
}
exports.CreateInventoryLogDto = CreateInventoryLogDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: InventoryType }),
    (0, class_validator_1.IsEnum)(InventoryType),
    __metadata("design:type", String)
], CreateInventoryLogDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateInventoryLogDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ example: 'Supplier delivery batch #42' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryLogDto.prototype, "note", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryLogDto.prototype, "reference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Product ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateInventoryLogDto.prototype, "productId", void 0);
//# sourceMappingURL=inventory.dto.js.map