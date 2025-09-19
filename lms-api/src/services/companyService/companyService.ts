import Company from '../../models/companies/companies';
import { AppError } from '../../middleware/errorHandler';
import { Op } from 'sequelize';
import {
  CompanyFilters,
  CreateCompanyData,
  UpdateCompanyData,
} from './company.interface';

export class CompanyService {
  /**
   * Get all companies with optional filtering and pagination
   */
  async getAllCompanies(filters: CompanyFilters = {}) {
    try {
      const whereClause: any = {};

      if (filters.name) {
        whereClause.name = { [Op.like]: `%${filters.name}%` };
      }

      if (filters.address) {
        whereClause.address = { [Op.like]: `%${filters.address}%` };
      }

      if (filters.vatNumber) {
        whereClause.vatNumber = { [Op.like]: `%${filters.vatNumber}%` };
      }

      if (filters.createdBy) {
        whereClause.createdBy = filters.createdBy;
      }

      if (filters.search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${filters.search}%` } },
          { address: { [Op.like]: `%${filters.search}%` } },
          { vatNumber: { [Op.like]: `%${filters.search}%` } },
        ];
      }

      const page = filters.page && filters.page > 0 ? filters.page : 1;
      const limit =
        filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 10;
      const offset = (page - 1) * limit;

      const { count, rows: companies } = await Company.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [
          {
            association: 'groups',
            required: false,
          },
        ],
      });

      const totalPages = Math.ceil(count / limit);

      return {
        companies,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: count,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
          nextPage: page < totalPages ? page + 1 : null,
          previousPage: page > 1 ? page - 1 : null,
        },
      };
    } catch (error) {
      throw new AppError('Failed to fetch companies', 500);
    }
  }

  /**
   * Get company by ID with related data
   */
  async getCompanyById(id: string) {
    try {
      if (!id) {
        throw new AppError('Company ID is required', 400);
      }

      const company = await Company.findByPk(id, {
        include: [
          {
            association: 'groups',
            required: false,
          },
        ],
      });

      if (!company) {
        throw new AppError('Company not found', 404);
      }

      return company;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to fetch company', 500);
    }
  }

  /**
   * Create a new company
   */
  async createCompany(data: CreateCompanyData & { createdBy: string }) {
    const transaction = await Company.sequelize!.transaction();
    try {
      if (!data.name || !data.vatNumber) {
        throw new AppError('Name and VAT number are required', 400);
      }

      const existingCompany = await Company.findOne({
        where: {
          vatNumber: data.vatNumber.trim().toUpperCase(),
        },
        transaction,
      });

      if (existingCompany) {
        throw new AppError('Company with this VAT number already exists', 409);
      }

      if (!this.isValidVATNumber(data.vatNumber)) {
        throw new AppError('Invalid VAT number format', 400);
      }

      const company = await Company.create(
        {
          name: data.name.trim(),
          address: data.address ? data.address.trim() : null,
          vatNumber: data.vatNumber.trim().toUpperCase(),
          createdBy: data.createdBy,
        },
        { transaction }
      );

      await transaction.commit();
      return company;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create company', 500);
    }
  }

  /**
   * Update an existing company
   */
  async updateCompany(id: string, data: UpdateCompanyData) {
    const transaction = await Company.sequelize!.transaction();
    try {
      if (!id) {
        throw new AppError('Company ID is required', 400);
      }

      const company = await Company.findByPk(id, { transaction });
      if (!company) {
        throw new AppError('Company not found', 404);
      }

      if (
        data.vatNumber &&
        data.vatNumber.trim().toUpperCase() !== company.vatNumber
      ) {
        const existingCompany = await Company.findOne({
          where: {
            vatNumber: data.vatNumber.trim().toUpperCase(),
            id: { [Op.ne]: id },
          },
          transaction,
        });

        if (existingCompany) {
          throw new AppError(
            'Company with this VAT number already exists',
            409
          );
        }

        if (!this.isValidVATNumber(data.vatNumber)) {
          throw new AppError('Invalid VAT number format', 400);
        }
      }

      const updateData: any = {};
      if (data.name) updateData.name = data.name.trim();
      if (data.address !== undefined)
        updateData.address = data.address ? data.address.trim() : null;
      if (data.vatNumber)
        updateData.vatNumber = data.vatNumber.trim().toUpperCase();

      await company.update(updateData, { transaction });

      await transaction.commit();
      return company;
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to update company', 500);
    }
  }

  /**
   * Delete a company
   */
  async deleteCompany(id: string) {
    const transaction = await Company.sequelize!.transaction();
    try {
      if (!id) {
        throw new AppError('Company ID is required', 400);
      }

      const company = await Company.findByPk(id, { transaction });
      if (!company) {
        throw new AppError('Company not found', 404);
      }

      const groupCount = await company.countGroups();
      if (groupCount > 0) {
        throw new AppError('Cannot delete company with associated groups', 400);
      }

      await company.destroy({ transaction });

      await transaction.commit();
      return { message: 'Company deleted successfully' };
    } catch (error) {
      await transaction.rollback();
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to delete company', 500);
    }
  }

  /**
   * Check if company exists
   */
  async companyExists(id: string): Promise<boolean> {
    try {
      const company = await Company.findByPk(id);
      return !!company;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get companies count
   */
  async getCompaniesCount(filters: CompanyFilters = {}): Promise<number> {
    try {
      const whereClause: any = {};

      if (filters.name) {
        whereClause.name = { [Op.like]: `%${filters.name}%` };
      }

      if (filters.address) {
        whereClause.address = { [Op.like]: `%${filters.address}%` };
      }

      if (filters.vatNumber) {
        whereClause.vatNumber = { [Op.like]: `%${filters.vatNumber}%` };
      }

      if (filters.search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${filters.search}%` } },
          { address: { [Op.like]: `%${filters.search}%` } },
          { vatNumber: { [Op.like]: `%${filters.search}%` } },
        ];
      }

      return await Company.count({ where: whereClause });
    } catch (error) {
      throw new AppError('Failed to get companies count', 500);
    }
  }

  /**
   * Basic VAT number validation
   */
  private isValidVATNumber(vatNumber: string): boolean {
    const cleanVAT = vatNumber.replace(/\s+/g, '');
    return (
      cleanVAT.length >= 8 &&
      cleanVAT.length <= 15 &&
      /^[A-Z0-9]+$/.test(cleanVAT)
    );
  }
}

export const companyService = new CompanyService();
