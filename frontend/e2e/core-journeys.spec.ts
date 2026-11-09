import { expect, test, type Page, type Route } from "@playwright/test";
import { emptyCart, filledCart } from "../src/test/fixtures";

const api = "**/api";
const testPassword = "pw";

const customer = {
  idUsuario: 21,
  codigoPublico: "customer-e2e",
  nombre: "Ana",
  apellido: "Prueba",
  correo: "ana.e2e@example.com",
  telefono: "55551234",
  rol: "Cliente",
};

const operator = {
  ...customer,
  idUsuario: 22,
  codigoPublico: "operator-e2e",
  nombre: "Olga",
  apellido: "Operaciones",
  correo: "olga.e2e@example.com",
  rol: "Operador",
};

const administrator = {
  ...customer,
  idUsuario: 23,
  codigoPublico: "admin-e2e",
  nombre: "Ada",
  apellido: "AdministraciÃ³n",
  correo: "ada.e2e@example.com",
  rol: "Administrador",
};

async function respondJson(route: Route, datos: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, datos }),
  });
}

async function mockStoreShell(page: Page) {
  await page.route(`${api}/catalogo/categorias**`, (route) =>
    respondJson(route, [{ IDCategoria: 1, Nombre: "Caballeros", Descripcion: "Moda para hombres" }]),
  );
  await page.route(`${api}/catalogo/productos**`, (route) =>
    respondJson(route, [], 200),
  );
  await page.route(`${api}/carrito`, (route) => respondJson(route, emptyCart));
}

test("customer chooses the customer portal, signs in and reaches their account", async ({ page }) => {
  let authenticated = false;
  let loginBody: unknown;
  await mockStoreShell(page);
  await page.route(`${api}/auth/me`, (route) =>
    authenticated
      ? respondJson(route, customer)
      : route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ ok: false, mensaje: "No autenticado." }),
        }),
  );
  await page.route(`${api}/auth/refresh`, (route) =>
    route.fulfill({ status: 401, contentType: "application/json", body: JSON.stringify({ ok: false }) }),
  );
  await page.route(`${api}/auth/login`, async (route) => {
    loginBody = route.request().postDataJSON();
    authenticated = true;
    await respondJson(route, { usuario: customer });
  });
  await page.route(`${api}/carrito/migrar`, (route) => respondJson(route, {}));
  await page.route(`${api}/pedidos/mis-pedidos**`, (route) => respondJson(route, []));
  await page.route(`${api}/auth/direcciones`, (route) => respondJson(route, []));

  await page.goto("/");
  await page.getByRole("button", { name: "Elegir tipo de acceso" }).click();
  await page.getByRole("menuitem", { name: "Cliente" }).click();
  await expect(page).toHaveURL(/\/acceso\?portal=cliente/);
  await page.getByLabel(/Correo electr/).fill(customer.correo);
  await page.getByLabel(/Contrase/).fill(testPassword);
  await page.getByRole("button", { name: "Ingresar" }).click();

  await expect(page).toHaveURL(/\/cuenta$/);
  await expect(page.getByRole("heading", { name: "Hola, Ana." })).toBeVisible();
  expect(loginBody).toEqual({ correo: customer.correo, password: testPassword });
});

test("customer manages a delivery address from the account", async ({ page }) => {
  let addresses: Array<Record<string, unknown>> = [];
  let createdAddress: Record<string, unknown> | undefined;
  let updatedAddress: Record<string, unknown> | undefined;
  let deletedAddress = false;
  await mockStoreShell(page);
  await page.route(`${api}/auth/me`, (route) => respondJson(route, customer));
  await page.route(`${api}/pedidos/mis-pedidos**`, (route) => respondJson(route, []));
  await page.route(`${api}/auth/direcciones**`, async (route) => {
    const method = route.request().method();
    if (method === "GET") return respondJson(route, addresses);
    if (method === "POST") {
      createdAddress = route.request().postDataJSON() as Record<string, unknown>;
      addresses = [{
        IDDireccion: 71,
        NombreDestinatario: createdAddress.nombreDestinatario,
        TelefonoContacto: createdAddress.telefonoContacto,
        DireccionLinea1: createdAddress.direccionLinea1,
        DireccionLinea2: createdAddress.direccionLinea2,
        Ciudad: createdAddress.ciudad,
        Departamento: createdAddress.departamento,
        CodigoPostal: createdAddress.codigoPostal,
        EsPrincipal: createdAddress.esPrincipal,
      }];
      return respondJson(route, {}, 201);
    }
    if (method === "PUT") {
      updatedAddress = route.request().postDataJSON() as Record<string, unknown>;
      addresses = addresses.map((address) => ({ ...address,
        NombreDestinatario: updatedAddress.nombreDestinatario,
        TelefonoContacto: updatedAddress.telefonoContacto,
        DireccionLinea1: updatedAddress.direccionLinea1,
        DireccionLinea2: updatedAddress.direccionLinea2,
        Ciudad: updatedAddress.ciudad,
        Departamento: updatedAddress.departamento,
        CodigoPostal: updatedAddress.codigoPostal,
        EsPrincipal: updatedAddress.esPrincipal,
      }));
      return respondJson(route, {});
    }
    if (method === "DELETE") {
      deletedAddress = true;
      addresses = [];
      return respondJson(route, {});
    }
    return route.fallback();
  });

  await page.goto("/cuenta");
  await page.getByRole("button", { name: /Agregar direcci/ }).click();
  await page.getByLabel("Nombre del destinatario").fill("Ana E2E");
  await page.getByLabel(/Tel/).fill("55551234");
  await page.getByLabel(/postal/).fill("01001");
  await page.getByLabel(/Direcci/, { exact: true }).fill("Avenida Reforma 10");
  await page.getByLabel("Complemento (opcional)").fill("Apto. 2");
  await page.getByLabel("Ciudad").fill("Guatemala");
  await page.getByLabel("Departamento").fill("Guatemala");
  await page.getByRole("button", { name: /Guardar direcci/ }).click();

  await expect(page.getByText("Ana E2E")).toBeVisible();
  expect(createdAddress).toMatchObject({
    nombreDestinatario: "Ana E2E",
    direccionLinea1: "Avenida Reforma 10",
    direccionLinea2: "Apto. 2",
    ciudad: "Guatemala",
    departamento: "Guatemala",
    codigoPostal: "01001",
  });

  await page.getByRole("button", { name: /Editar direcci.*Ana E2E/ }).click();
  await page.getByLabel(/Direcci/, { exact: true }).fill("Avenida Reforma 20");
  await page.getByRole("button", { name: /Guardar direcci/ }).click();
  await expect(page.getByText("Avenida Reforma 20")).toBeVisible();
  expect(updatedAddress).toMatchObject({ direccionLinea1: "Avenida Reforma 20" });

  await page.getByRole("button", { name: /Eliminar direcci.*Ana E2E/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Eliminar" }).click();
  await expect(page.getByText(/no tienes direcciones guardadas/)).toBeVisible();
  expect(deletedAddress).toBe(true);
});

test("customer completes checkout and sees the confirmed order", async ({ page }) => {
  const address = {
    IDDireccion: 31,
    NombreDestinatario: "Ana E2E",
    TelefonoContacto: "55551234",
    DireccionLinea1: "Avenida Reforma 10",
    DireccionLinea2: null,
    Ciudad: "Guatemala",
    Departamento: "Guatemala",
    CodigoPostal: "01001",
    EsPrincipal: true,
  };
  let reservationBody: Record<string, unknown> | undefined;
  let confirmationBody: Record<string, unknown> | undefined;
  const order = { CodigoPublico: "order-e2e", NumeroPedido: "DA-E2E-001", Total: 249 };
  await mockStoreShell(page);
  await page.route(`${api}/auth/me`, (route) => respondJson(route, customer));
  await page.route(`${api}/auth/direcciones`, (route) => respondJson(route, [address]));
  await page.route(`${api}/carrito`, (route) => respondJson(route, filledCart));
  await page.route(`${api}/pedidos/checkout/reserva`, async (route) => {
    reservationBody = route.request().postDataJSON() as Record<string, unknown>;
    await respondJson(route, {});
  });
  await page.route(`${api}/pedidos/checkout/confirmar`, async (route) => {
    confirmationBody = route.request().postDataJSON() as Record<string, unknown>;
    await respondJson(route, order);
  });
  await page.route(`${api}/pedidos/order-e2e`, (route) => respondJson(route, order));

  await page.goto("/checkout");
  await page.getByRole("radio", { name: /Ana E2E/ }).check();
  await page.getByRole("button", { name: "Confirmar pedido" }).click();

  await expect(page).toHaveURL(/\/pedido-confirmado\/order-e2e$/);
  await expect(page.getByRole("heading", { name: "Gracias por elegirnos." })).toBeVisible();
  expect(reservationBody).toMatchObject({ claveIdempotencia: expect.any(String) });
  expect(confirmationBody).toMatchObject({
    idDireccionEntrega: 31,
    metodoPago: "TARJETA_CREDITO",
    simularResultadoPago: "APROBADO",
  });
});

test("operator advances an order through its allowed state transition", async ({ page }) => {
  const order = {
    IDPedido: 41,
    CodigoPublico: "order-41",
    NumeroPedido: "DA-E2E-041",
    IDUsuario: 7,
    NombreCliente: "Ana E2E",
    CorreoCliente: customer.correo,
    Subtotal: 249,
    Descuento: 0,
    IVA: 0,
    Total: 249,
    Estado: "PAGADO",
    MetodoPago: "TARJETA_CREDITO",
    FechaCreacion: "2026-11-09T12:00:00.000Z",
    FechaModificacion: null,
    TotalRegistros: 1,
  };
  let statusBody: Record<string, unknown> | undefined;
  let currentStatus = "PAGADO";
  await page.route(`${api}/auth/me`, (route) => respondJson(route, operator));
  await page.route(`${api}/pedidos**`, async (route) => {
    if (route.request().method() === "PATCH") {
      statusBody = route.request().postDataJSON() as Record<string, unknown>;
      currentStatus = String(statusBody.estadoNuevo);
      return respondJson(route, {});
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        datos: [{ ...order, Estado: currentStatus }],
        totalRegistros: 1,
        paginaActual: 1,
        tamanoPagina: 10,
        totalPaginas: 1,
      }),
    });
  });

  await page.goto("/operaciones/pedidos");
  await expect(page.getByRole("heading", { name: "Pedidos" })).toBeVisible();
  await page.getByRole("button", { name: /Iniciar preparaci/ }).click();

  expect(statusBody).toEqual({ estadoNuevo: "EN_PREPARACION" });
});

test("administrator creates a product from the catalog workspace", async ({ page }) => {
  const category = {
    IDCategoria: 3,
    IDCategoriaPadre: null,
    CategoriaPadre: null,
    Nombre: "TecnologÃ­a",
    Descripcion: "Dispositivos y accesorios",
    Activo: true,
    TotalProductosActivos: 0,
  };
  let createdProduct: Record<string, unknown> | undefined;
  const createdProducts: Array<Record<string, unknown>> = [];
  await page.route(`${api}/auth/me`, (route) => respondJson(route, administrator));
  await page.route(`${api}/catalogo/categorias**`, (route) => respondJson(route, [category]));
  await page.route(`${api}/catalogo/productos**`, async (route) => {
    if (route.request().method() === "POST") {
      createdProduct = route.request().postDataJSON() as Record<string, unknown>;
      const product = {
        IDProducto: 90,
        CodigoPublico: "product-e2e",
        IDCategoria: 3,
        Categoria: category.Nombre,
        Nombre: String(createdProduct.nombre),
        Descripcion: String(createdProduct.descripcion),
        Activo: true,
        PrecioMinimo: null,
        PrecioMaximo: null,
        TotalStockDisponible: 0,
        TotalVariantes: 0,
      };
      createdProducts.push(product);
      return respondJson(route, product, 201);
    }
    const products = createdProducts.map((product) => ({ ...product, TotalRegistros: 1 }));
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, datos: products, totalRegistros: products.length, totalPaginas: 1, paginaActual: 1 }),
    });
  });

  await page.goto("/administracion/catalogo");
  await page.getByRole("tab", { name: "Productos y variantes" }).click();
  await page.getByRole("button", { name: "Nuevo producto" }).click();
  await page.getByLabel("Nombre").fill("Auriculares E2E");
  await page.getByLabel(/Descrip/).fill("Auriculares de prueba para el flujo E2E.");
  await page.getByRole("combobox", { name: /Categor/ }).click();
  await page.getByRole("option", { name: /Tecnolog/ }).click();
  await page.getByRole("button", { name: "Crear producto" }).click();

  await expect(page.getByText("Producto creado. Ahora puedes agregar sus variantes.")).toBeVisible();
  expect(createdProduct).toEqual({
    idCategoria: 3,
    nombre: "Auriculares E2E",
    descripcion: "Auriculares de prueba para el flujo E2E.",
  });
});

