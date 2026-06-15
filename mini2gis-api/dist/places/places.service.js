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
exports.PlacesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const place_entity_1 = require("./place.entity");
let PlacesService = class PlacesService {
    repo;
    constructor(repo) {
        this.repo = repo;
    }
    findByBbox({ minLat, maxLat, minLng, maxLng, category, limit = 200 }) {
        const qb = this.repo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.category', 'c')
            .where('p.lat BETWEEN :minLat AND :maxLat', { minLat, maxLat })
            .andWhere('p.lng BETWEEN :minLng AND :maxLng', { minLng, maxLng })
            .limit(limit);
        if (category) {
            qb.andWhere('c.slug = :category', { category });
        }
        return qb.getMany();
    }
    findOne(id) {
        return this.repo.findOne({ where: { id }, relations: { category: true } });
    }
};
exports.PlacesService = PlacesService;
exports.PlacesService = PlacesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(place_entity_1.Place)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PlacesService);
//# sourceMappingURL=places.service.js.map