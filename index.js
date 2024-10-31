const express = require("express");
const { Pool } = require("pg");
const dotenv = require("dotenv");
const cors = require("cors");

// Cargar las variables de entorno desde .env
dotenv.config();

// Crear el servidor Express
const app = express();
const port = 3000;
const host = "35.238.93.30";

const corsOptions = {
  origin: "*", // Permitir cualquier origen
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// Configurar middleware
app.use(express.json()); // Para parsear JSON
app.use(cors()); // Habilitar CORS para que el frontend pueda hacer solicitudes

// Configurar la conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Ruta de prueba
app.get("/", (req, res) => {
  res.send("¡Servidor funcionando correctamente!");
});

// Ruta para comprobar si un código de barras existe
app.get("/api/check-code", async (req, res) => {
  const { barcode } = req.query;

  if (!barcode) {
    return res
      .status(400)
      .json({ message: "El código de barras es obligatorio." });
  }

  try {
    const result = await pool.query("SELECT * FROM barcodes WHERE code = $1", [
      barcode,
    ]);
    res.status(200).json({ exists: result.rowCount > 0 });
  } catch (error) {
    console.error("Error al comprobar el código:", error);
    res
      .status(500)
      .json({ message: "Error al comprobar el código en la base de datos." });
  }
});

// Ruta para obtener todos los productos
app.get("/api/get-products", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM barcodes");
    console.log("Productos obtenidos:", result.rows);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error al obtener los productos:", error);
    res
      .status(500)
      .json({ message: "Error al obtener los productos de la base de datos." });
  }
});

// Ruta para guardar el código de barras
app.post("/api/save-code", async (req, res) => {
  const {
    barcode,
    name,
    entryDate,
    expiryDate,
    withdrawalDate,
    weight,
    quantity,
    batch,
  } = req.body;

  if (
    !barcode ||
    !name ||
    !entryDate ||
    !expiryDate ||
    !weight ||
    !quantity ||
    !batch
  ) {
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios." });
  }

  try {
    // Guardar el código y otros datos en la base de datos
    const result = await pool.query(
      "INSERT INTO barcodes (code, name, entry_date, expiry_date, withdrawal_date, weight, quantity, batch) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [
        barcode,
        name,
        entryDate,
        expiryDate,
        withdrawalDate,
        weight,
        quantity,
        batch,
      ]
    );
    res
      .status(200)
      .json({ message: "Código guardado con éxito!", data: result.rows[0] });
  } catch (error) {
    console.error("Error al guardar el código:", error);
    res
      .status(500)
      .json({ message: "Error al guardar el código en la base de datos." });
  }
});

// Ruta para actualizar los detalles del código de barras
app.put("/api/update-code", async (req, res) => {
  const {
    barcode,
    entryDate,
    expiryDate,
    withdrawalDate,
    weight,
    quantity,
    batch,
  } = req.body;

  if (!barcode) {
    return res
      .status(400)
      .json({ message: "El código de barras es obligatorio." });
  }

  try {
    // Actualizar los detalles en la base de datos
    const result = await pool.query(
      `UPDATE barcodes 
       SET entry_date = $1, expiry_date = $2, withdrawal_date = $3, 
           weight = $4, quantity = $5, batch = $6 
       WHERE code = $7 RETURNING *`,
      [entryDate, expiryDate, withdrawalDate, weight, quantity, batch, barcode]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Código no encontrado." });
    }

    res
      .status(200)
      .json({
        message: "Detalles actualizados con éxito!",
        data: result.rows[0],
      });
  } catch (error) {
    console.error("Error al actualizar los detalles:", error);
    res
      .status(500)
      .json({
        message: "Error al actualizar los detalles en la base de datos.",
      });
  }
});

// Iniciar el servidor
app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor escuchando en http://${host}:${port}`);
});
