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
exports.ReceiveItemDto = exports.ReceivePurchaseOrderDto = exports.UpdatePurchaseOrderStatusDto = exports.POStatus = exports.CreatePurchaseOrderDto = exports.PurchaseOrderItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class PurchaseOrderItemDto {
    productId;
    quantity;
    unitCost;
}
exports.PurchaseOrderItemDto = PurchaseOrderItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PurchaseOrderItemDto.prototype, "productId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 50 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], PurchaseOrderItemDto.prototype, "quantity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 18000 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PurchaseOrderItemDto.prototype, "unitCost", void 0);
class CreatePurchaseOrderDto {
    supplierId;
    note;
    items;
}
exports.CreatePurchaseOrderDto = CreatePurchaseOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "supplierId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePurchaseOrderDto.prototype, "note", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [PurchaseOrderItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PurchaseOrderItemDto),
    __metadata("design:type", Array)
], CreatePurchaseOrderDto.prototype, "items", void 0);
var POStatus;
(function (POStatus) {
    POStatus["PENDING"] = "PENDING";
    POStatus["RECEIVED"] = "RECEIVED";
    POStatus["PARTIAL"] = "PARTIAL";
    POStatus["CANCELLED"] = "CANCELLED";
})(POStatus || (exports.POStatus = POStatus = {}));
class UpdatePurchaseOrderStatusDto {
    status;
}
exports.UpdatePurchaseOrderStatusDto = UpdatePurchaseOrderStatusDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: POStatus }),
    (0, class_validator_1.IsEnum)(POStatus),
    __metadata("design:type", String)
], UpdatePurchaseOrderStatusDto.prototype, "status", void 0);
class ReceivePurchaseOrderDto {
    items;
}
exports.ReceivePurchaseOrderDto = ReceivePurchaseOrderDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Items with received quantities' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ReceiveItemDto),
    __metadata("design:type", Array)
], ReceivePurchaseOrderDto.prototype, "items", void 0);
class ReceiveItemDto {
    purchaseOrderItemId;
    receivedQty;
}
exports.ReceiveItemDto = ReceiveItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReceiveItemDto.prototype, "purchaseOrderItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 25 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], ReceiveItemDto.prototype, "receivedQty", void 0);
//# sourceMappingURL=purchase-order.dto.js.map