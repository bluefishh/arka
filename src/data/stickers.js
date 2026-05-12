import { SELECCIONES } from "./teams";

export const INTRO_CANTIDAD = 10;
export const ESTAMPAS_POR_SELECCION = 20;
export const ESPECIALES_CANTIDAD = 10;
const CANTIDAD_SELECCIONES = SELECCIONES.reduce(
    (total, seleccion) => total + (seleccion.cantidad ?? ESTAMPAS_POR_SELECCION),
    0
);
const INICIO_ESPECIALES = 971; // rango fijo para especiales, evita desplazamientos de numeración
export const TOTAL_ESTAMPAS = INTRO_CANTIDAD + CANTIDAD_SELECCIONES + ESPECIALES_CANTIDAD;

const INTRO_SECCION = "Intro FIFA";

const FWC_NOMBRES = {
    FWC1: [
        "We Are Panini",
        "FIFA World Cup",
        "FIFA World Cup",
        "Official Mascots",
        "Official Slogan",
    ],
    FWC2: [
        "Official Match Ball",
        "Host Country Emblem",
        "Host Country Emblem",
        "Host Country Emblem",
    ],
    FWC3: [
        "Italy 1934™",
        "Uruguay 1950™",
        "Switzerland 1954™",
        "Chile 1962™",
        "Germany 1974™",
        "Mexico 1986™",
        "USA 1994™",
        "Korea/Japan 2002™",
        "Germany 2006™",
        "Brazil 2014™",
        "Qatar 2022™",
    ],
};

const INTRO_ELEMENTOS = [
    "Logo FIFA World Cup 2026",
    "Trofeo FIFA World Cup",
    "Póster oficial",
    "Mascota oficial",
    "Estados Unidos",
    "México",
    "Canadá",
    "Balón oficial",
    "Emblema oficial",
    "Intro FIFA",
];

const crearIntroEstampas = () => {
    return INTRO_ELEMENTOS.map((nombre, index) => {
        const numero = index + 1;
        return {
            id: `S${numero}`,
            numero,
            codigo: `INT-${numero}`,
            nombre,
            equipo: INTRO_SECCION,
            categoria: "Intro FIFA",
            tipo: "Normal",
            estado: "faltante",
            repetidas: 0,
            actualizadoEn: null,
        };
    });
};

const crearEstampasSelecciones = () => {
    const estampas = [];
    SELECCIONES.forEach((seleccion) => {
        const cantidad = seleccion.cantidad ?? ESTAMPAS_POR_SELECCION;
        for (let puesto = 1; puesto <= cantidad; puesto += 1) {
            const numero = seleccion.inicio + puesto - 1;
            let categoria = "Jugador";
            let nombre = `${seleccion.nombre}`;
            const nombresFwc = FWC_NOMBRES[seleccion.codigo];
            if (nombresFwc && nombresFwc[puesto - 1]) {
                nombre = nombresFwc[puesto - 1];
            }
            if (puesto === 13 && seleccion.categoria !== "FWC" && seleccion.categoria !== "CocaCola") {
                categoria = "Foto grupal";
                nombre = `${seleccion.nombre} Foto grupal`;
            }
            if (puesto === 1 && seleccion.categoria !== "FWC" && seleccion.categoria !== "CocaCola") {
                categoria = "Escudo";
                nombre = `${seleccion.nombre} Escudo`;
            }
            const tipo = categoria === "Escudo" ? "Brillante" : "Normal";

            estampas.push({
                id: `S${seleccion.codigo}-${puesto}`,
                numero,
                codigo: `${seleccion.codigo}-${puesto}`,
                nombre,
                equipo: seleccion.nombre,
                categoria,
                tipo,
                estado: "faltante",
                repetidas: 0,
                actualizadoEn: null,
            });
        }
    });

    return estampas;
};

const crearEstampasEspeciales = () => {
    const nombres = [
        "Leyendas 1",
        "Leyendas 2",
        "Leyendas 3",
        "Leyendas 4",
        "Leyendas 5",
        "Leyendas 6",
        "Leyendas 7",
        "Leyendas 8",
        "Especial FIFA",
        "Trofeo Holográfico",
    ];

    return nombres.map((nombre, index) => {
        const numero = INICIO_ESPECIALES + index;
        return {
            id: `S${numero}`,
            numero,
            codigo: `ESP-${index + 1}`,
            nombre,
            equipo: "Especiales",
            categoria: "Especiales",
            tipo: "Especial",
            estado: "faltante",
            repetidas: 0,
            actualizadoEn: null,
        };
    });
};

export const generarEstampas = () => {
    return [
        ...crearIntroEstampas(),
        ...crearEstampasSelecciones(),
        ...crearEstampasEspeciales(),
    ];
};
