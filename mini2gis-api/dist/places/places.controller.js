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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlacesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const places_service_1 = require("./places.service");
let PlacesController = class PlacesController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    findAll(bbox, category) {
        const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
        return this.svc.findByBbox({ minLat, maxLat, minLng, maxLng, category });
    }
    async findOne(id) {
        const place = await this.svc.findOne(+id);
        if (!place)
            throw new common_1.NotFoundException();
        return place;
    }
};
exports.PlacesController = PlacesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiQuery)({ name: 'bbox', description: 'minLng,minLat,maxLng,maxLat', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'category', required: false }),
    __param(0, (0, common_1.Query)('bbox')),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PlacesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PlacesController.prototype, "findOne", null);
exports.PlacesController = PlacesController = __decorate([
    (0, swagger_1.ApiTags)('places'),
    (0, common_1.Controller)('places'),
    __metadata("design:paramtypes", [places_service_1.PlacesService])
], PlacesController);
//# sourceMappingURL=places.controller.js.map