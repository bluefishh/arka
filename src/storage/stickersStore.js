import AsyncStorage from "@react-native-async-storage/async-storage";

const CLAVE_ALMACEN = "arka.estampas.v1";

export const cargarEstampas = async () => {
    const raw = await AsyncStorage.getItem(CLAVE_ALMACEN);
    if (!raw) {
        return null;
    }
    return JSON.parse(raw);
};

export const guardarEstampas = async (estampas) => {
    await AsyncStorage.setItem(CLAVE_ALMACEN, JSON.stringify(estampas));
};
