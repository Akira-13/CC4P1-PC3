import express from 'express';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const app = express()
const PORT = 8000;

app.use(express.json())




app.post("/register", async (req, res) => {
    try {
        // Leer cuentas
        const data = fs.readFileSync("./cuentas.json", "utf-8");
        const cuentas = JSON.parse(data);

        // Agregar nueva cuenta
        const account = { ...req.body, id: uuidv4() };


        console.log(account)
        cuentas.push(account);

        // Guardar cuentas
        fs.writeFileSync("./cuentas.json", JSON.stringify(cuentas, null, 2));

        res.json({ message: "Usuario agregado correctamente" });
    } catch (err) {
        res.status(500).json({ error: "Error al registrar usuario" });
    }
});



app.post("/transaction", async (req, res) => {
    try {
        const { idOrigen, idDestino, monto } = req.body;
        if (typeof monto !== "number" || monto <= 0) {
            return res.status(400).json({ error: "Datos de transacción incompletos o inválidos" });
        }
        // Leer cuentas
        const data = fs.readFileSync("./cuentas.json", "utf-8");
        const cuentas = JSON.parse(data);

        // Buscar cuentas de origen y destino por id
        const cuentaOrigen = cuentas.find(c => c.id === idOrigen);
        const cuentaDestino = cuentas.find(c => c.dni === idDestino);

        if (!cuentaOrigen) {
            return res.status(404).json({ error: "Cuenta de origen no encontrada" });
        }
        if (!cuentaDestino) {
            return res.status(404).json({ error: "Cuenta de destino no encontrada" });
        }
        if ((cuentaOrigen.saldo || 0) < monto) {
            return res.status(400).json({ error: "Fondos insuficientes en la cuenta de origen" });
        }


        // Realizar transferencia
        cuentaOrigen.saldo -= monto;
        cuentaDestino.saldo = (cuentaDestino.saldo || 0) + monto;

        // Inicializar transacciones si no existen
        if (!Array.isArray(cuentaOrigen.transacciones)) cuentaOrigen.transacciones = [];
        if (!Array.isArray(cuentaDestino.transacciones)) cuentaDestino.transacciones = [];

        const now = new Date();
        const formatted = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        cuentaOrigen.transacciones.push({ fecha: formatted, destino: cuentaDestino.usuario, monto: (" - " + monto), tipo: "Salida" });
        cuentaDestino.transacciones.push({ fecha: formatted, origen: cuentaOrigen.usuario, monto: (" + " + monto), tipo: "Ingreso" });

        // Guardar cuentas
        fs.writeFileSync("./cuentas.json", JSON.stringify(cuentas, null, 2));

        res.json({ message: "Transferencia realizada correctamente", saldoOrigen: cuentaOrigen.saldo, saldoDestino: cuentaDestino.saldo });
    } catch (err) {
        res.status(500).json({ error: "Error al procesar transacción" });
    }
});


app.get("/consultar", async (req, res) => {
    const { userId } = req.query

    console.log(userId)
    const data = fs.readFileSync("./cuentas.json", "utf-8");
    const cuentas = JSON.parse(data);

    console.log("Cuentas\n" + JSON.stringify(cuentas))
    const cuenta = cuentas.find(acc => acc.id === userId)

    if (!cuenta) return res.status(404).json({ error: "No se encuentra al usuario con esas credenciales" });

    return res.json(cuenta)

})


app.post("/login", async (req, res) => {
    try {
        // Leer cuentas
        const data = fs.readFileSync("./cuentas.json", "utf-8");
        const cuentas = JSON.parse(data);
        const { usuario, password } = req.body;

        const cuenta = cuentas.find(acc => (acc.usuario === usuario && acc.password === password))

        if (!cuenta) return res.status(401).json({ error: "credenciales incorrectas" })

        res.json(cuenta);
    } catch (err) {
        res.status(500).json({ error: "Error al logear el usuario" });
    }
})

app.listen(PORT, console.log(`LISTEN ON PORT ${PORT}`))