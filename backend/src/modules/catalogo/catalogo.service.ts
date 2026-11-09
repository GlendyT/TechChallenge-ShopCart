import { AppError } from "../../errors/AppError";
import { catalogoRepository } from "./catalogo.repository";

type CrearVarianteInput = Omit<
  Parameters<typeof catalogoRepository.crearVariante>[0],
  "sku"
> & { sku?: string };

type CatalogoVariantRepository = Pick<
  typeof catalogoRepository,
  "crearVariante"
>;

const MAX_SKU_ATTEMPTS = 9999;

export class CatalogoService {
  private readonly repository: CatalogoVariantRepository;

  constructor(repository: CatalogoVariantRepository = catalogoRepository) {
    this.repository = repository;
  }

  async crearVariante(data: CrearVarianteInput) {
    const skuManual = data.sku?.trim();
    if (skuManual) {
      return this.repository.crearVariante({ ...data, sku: skuManual });
    }

    for (let attempt = 1; attempt <= MAX_SKU_ATTEMPTS; attempt += 1) {
      const sku = this.generarSku(data, attempt);
      try {
        return await this.repository.crearVariante({ ...data, sku });
      } catch (error) {
        if (!this.esConflictoDeSku(error)) throw error;
      }
    }

    throw new AppError(
      "No fue posible generar un SKU unico para esta variante. Intenta con un SKU manual.",
      409,
    );
  }

  private generarSku(data: CrearVarianteInput, attempt: number): string {
    const productCode = `P${data.idProducto}`;
    const variantCode = this.normalizarSegmento(data.color || data.nombre);
    const sizeCode = this.normalizarSegmento(data.talla || "STD");
    const sequence = String(attempt).padStart(2, "0");

    return `${productCode}-${variantCode}-${sizeCode}-${sequence}`;
  }

  private normalizarSegmento(value: string): string {
    const segment = value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 5);

    return segment || "VAR";
  }

  private esConflictoDeSku(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;

    const sqlError = error as { number?: number; message?: string };
    if (sqlError.number === 2601 || sqlError.number === 2627) return true;

    return (
      sqlError.number === 50000 &&
      sqlError.message
        ?.toLocaleLowerCase("es-GT")
        .includes("ya existe una variante con el sku especificado") === true
    );
  }
}

export const catalogoService = new CatalogoService();
