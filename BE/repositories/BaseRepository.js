import { Op } from "sequelize";

export class BaseRepository {
    constructor(model) {
        this.model = model;
        this.pageSize = 20;
    }

    async findAll(options = {}) {
        return await this.model.findAll(options);
    }

    async findById(id, options = {}) {
        return await this.model.findByPk(id, options);
    }

    async create(data, options = {}) {
        return await this.model.create(data, options);
    }

    async update(id, data, options = {}) {
        const [affectedCount] = await this.model.update(data, {
            where: { id },
            ...options,
        });
        return affectedCount;
    }

    async delete(id, options = {}) {
        return await this.model.destroy({
            where: { id },
            ...options,
        });
    }

    async count(options = {}) {
        return await this.model.count(options);
    }

    /**
     * Paginate results
     * @param {number} page
     * @param {object} options - Sequelize find options
     * @returns {Promise<{data: any[], currentPage: number, totalPages: number, totalItems: number}>}
     */
    async paginate(page = 1, options = {}) {
        const limit = this.pageSize;
        const offset = (page - 1) * limit;

        const { count, rows } = await this.model.findAndCountAll({
            ...options,
            limit,
            offset,
        });

        return {
            data: rows,
            currentPage: page,
            totalPages: Math.ceil(count / limit),
            totalItems: count,
        };
    }

    /**
     * Calculate pagination metadata for a new item (used in existing logic)
     * @returns {Promise<{currentPage: number}>}
     */
    async getPageForNewItem() {
        const totalItems = await this.count();
        return {
            currentPage: Math.ceil((totalItems + 1) / this.pageSize),
        };
    }
}
