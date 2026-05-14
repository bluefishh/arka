import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import {
	SpaceGrotesk_400Regular,
	SpaceGrotesk_500Medium,
	SpaceGrotesk_700Bold,
	useFonts,
} from "@expo-google-fonts/space-grotesk";
import { StatusBar } from "expo-status-bar";
import { Alert, Platform, Share, StyleSheet, Text, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { generarEstampas } from "./src/data/stickers";
import AlbumScreen from "./src/screens/AlbumScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ProgressScreen from "./src/screens/ProgressScreen";
import RepeatsScreen from "./src/screens/RepeatsScreen";

const Tab = createBottomTabNavigator();

function MainNavigator({
	estampas,
	actualizarEstampa,
	compartirAvanceTexto,
	copiarAvanceTexto,
	importarDesdeTexto,
	historialRespaldos,
	restaurarDesdeHistorial,
	tieneCambios,
	ultimoGuardadoEn,
	restablecerAvance,
}) {
	const insets = useSafeAreaInsets();

	return (
		<NavigationContainer>
			<Tab.Navigator
				sceneContainerStyle={{ backgroundColor: "#f8fafc" }}
				safeAreaInsets={{ bottom: 0 }}
				screenOptions={({ route }) => {
					const ocultarBarra = route.name === "Inicio";
					const baseTabBarStyle = {
						flexDirection: "row",
						alignItems: "center",
						justifyContent: "center",
						alignSelf: "center",
						width: "92%",
						borderWidth: 0.5,
						borderColor: "#e2e8f0",
						borderRadius: 20,
						backgroundColor: "#f8fafc",
						shadowOpacity: 0.08,
						shadowOffset: { width: 0, height: -4 },
						shadowRadius: 10,
						elevation: 5,
					};
					const tabBarStyle = ocultarBarra
						? { display: "none" }
						: Platform.OS === "web"
							? { ...baseTabBarStyle, height: 62, paddingBottom: 9, paddingTop: 7, marginBottom: 16 }
							: { ...baseTabBarStyle, height: 62, paddingBottom: 0, paddingTop: 0, marginBottom: insets.bottom + 8, overflow: "visible" };
					return {
						headerShown: false,
						tabBarActiveTintColor: "#1f2937",
						tabBarInactiveTintColor: "#94a3b8",
						tabBarShowLabel: false,
						tabBarItemStyle: {
							flex: 1,
							height: 62,
							justifyContent: "center",
							alignItems: "center",
							paddingVertical: 0,
							marginVertical: 0,
							overflow: "visible",
						},
						tabBarIconStyle: {
							width: "100%",
							height: "100%",
							alignItems: "center",
							justifyContent: "center",
						},
						tabBarStyle,
						tabBarIcon: ({ color, focused, size }) => {
							let iconName = "home";
							if (route.name === "Mi álbum") {
								iconName = "book";
							} else if (route.name === "Repetidas") {
								iconName = "repeat";
							} else if (route.name === "Progreso") {
								iconName = "stats-chart";
							}
							return (
								<Ionicons
									name={iconName}
									size={focused ? 24 : size ?? 22}
									color={color}
								/>
							);
						},
					};
				}}
			>
				<Tab.Screen name="Inicio">
					{(props) => (
						<HomeScreen
							{...props}
							estampas={estampas}
							compartirAvanceTexto={compartirAvanceTexto}
							copiarAvanceTexto={copiarAvanceTexto}
							importarDesdeTexto={importarDesdeTexto}
							historialRespaldos={historialRespaldos}
							restaurarDesdeHistorial={restaurarDesdeHistorial}
							tieneCambios={tieneCambios}
							ultimoGuardadoEn={ultimoGuardadoEn}
							restablecerAvance={restablecerAvance}
						/>
					)}
				</Tab.Screen>
				<Tab.Screen name="Mi álbum">
					{() => (
						<AlbumScreen
							estampas={estampas}
							actualizarEstampa={actualizarEstampa}
							tieneCambios={tieneCambios}
						/>
					)}
				</Tab.Screen>
				<Tab.Screen name="Repetidas">
					{() => (
						<RepeatsScreen estampas={estampas} actualizarEstampa={actualizarEstampa} />
					)}
				</Tab.Screen>
				<Tab.Screen name="Progreso">
					{() => <ProgressScreen estampas={estampas} />}
				</Tab.Screen>
			</Tab.Navigator>
		</NavigationContainer>
	);
}

export default function App() {
	const [estampas, setEstampas] = useState([]);
	const [listo, setListo] = useState(false);
	const [avisoMostrado, setAvisoMostrado] = useState(false);
	const [tieneCambios, setTieneCambios] = useState(false);
	const [ultimoGuardadoEn, setUltimoGuardadoEn] = useState(null);
	const [historialRespaldos, setHistorialRespaldos] = useState([]);
	const archivoLocal = `${FileSystem.documentDirectory}arka-estampas.json`;
	const almacenamientoWebKey = "arka.estampas.local";
	const almacenamientoAsyncKey = "arka.estampas.local";
	const historialKey = "arka.estampas.historial";
	const [fuentesCargadas] = useFonts({
		SpaceGrotesk_400Regular,
		SpaceGrotesk_500Medium,
		SpaceGrotesk_700Bold,
		...Ionicons.font,
	});

	const normalizarImportadas = (importadas) => {
		const generadas = generarEstampas();
		const mapaImportadas = new Map(
			importadas
				.filter((item) => item && item.codigo)
				.map((item) => [item.codigo, item])
		);
		return generadas.map((estampa) => {
			const importada = mapaImportadas.get(estampa.codigo);
			if (!importada) {
				return estampa;
			}
			return {
				...estampa,
				estado: importada.estado ?? estampa.estado,
				repetidas:
					Number.isFinite(importada.repetidas) && importada.repetidas >= 0
						? importada.repetidas
						: estampa.repetidas,
				actualizadoEn: importada.actualizadoEn ?? estampa.actualizadoEn,
			};
		});
	};

	const actualizarHistorial = async (payload) => {
		try {
			const raw = await AsyncStorage.getItem(historialKey);
			const actual = raw ? JSON.parse(raw) : [];
			const lista = Array.isArray(actual) ? actual : [];
			const ultimo = lista[0];
			if (ultimo && JSON.stringify(ultimo.estampas) === JSON.stringify(payload.estampas)) {
				return;
			}
			const entrada = {
				guardadoEn: payload.actualizadoEn,
				estampas: payload.estampas,
			};
			const nuevaLista = [entrada, ...lista].slice(0, 3);
			await AsyncStorage.setItem(historialKey, JSON.stringify(nuevaLista));
			setHistorialRespaldos(nuevaLista);
		} catch (error) {
			return;
		}
	};

	const guardarArchivoLocal = async (data) => {
		const payload = {
			version: 1,
			actualizadoEn: new Date().toISOString(),
			estampas: data,
		};
		if (Platform.OS === "web") {
			try {
				localStorage.setItem(almacenamientoWebKey, JSON.stringify(payload));
			} catch (error) {
				return;
			}
			setUltimoGuardadoEn(payload.actualizadoEn);
			return;
		}
		try {
			await AsyncStorage.setItem(almacenamientoAsyncKey, JSON.stringify(payload));
			await actualizarHistorial(payload);
			setUltimoGuardadoEn(payload.actualizadoEn);
		} catch (error) {
			return;
		}
	};

	const compartirAvanceTexto = async () => {
		try {
			const payload = {
				version: 1,
				exportadoEn: new Date().toISOString(),
				estampas,
			};
			const resultado = await Share.share({
				message: JSON.stringify(payload),
				title: "Exportar avance",
			});
			if (resultado?.action === Share.dismissedAction) {
				await Clipboard.setStringAsync(JSON.stringify(payload));
				Alert.alert("Compartir", "No se compartio. Se copio al portapapeles.");
			}
		} catch (error) {
			try {
				const payload = {
					version: 1,
					exportadoEn: new Date().toISOString(),
					estampas,
				};
				await Clipboard.setStringAsync(JSON.stringify(payload));
				Alert.alert("Compartir", "No se pudo abrir el selector. Se copio al portapapeles.");
			} catch (innerError) {
				Alert.alert("Compartir", "No se pudo compartir ni copiar el avance.");
			}
		}
	};

	const copiarAvanceTexto = async () => {
		try {
			const payload = {
				version: 1,
				exportadoEn: new Date().toISOString(),
				estampas,
			};
			await Clipboard.setStringAsync(JSON.stringify(payload));
			Alert.alert("Portapapeles", "Avance copiado al portapapeles.");
		} catch (error) {
			Alert.alert("Portapapeles", "No se pudo copiar el avance.");
		}
	};


	const importarDesdeTexto = async (texto) => {
		try {
			if (!texto || texto.trim() === "") {
				return { ok: false, mensaje: "Pega el contenido JSON del avance." };
			}
			const parsed = JSON.parse(texto.trim());
			const importadas = Array.isArray(parsed) ? parsed : parsed.estampas;
			if (!Array.isArray(importadas)) {
				return { ok: false, mensaje: "El texto no tiene un formato valido." };
			}
			const normalizadas = normalizarImportadas(importadas);
			setEstampas(normalizadas);
			setTieneCambios(false);
			await guardarArchivoLocal(normalizadas);
			return { ok: true };
		} catch (error) {
			return { ok: false, mensaje: "No se pudo leer el JSON." };
		}
	};

	const restaurarDesdeHistorial = async (entrada) => {
		if (!entrada?.estampas) {
			return false;
		}
		const normalizadas = normalizarImportadas(entrada.estampas);
		setEstampas(normalizadas);
		setTieneCambios(false);
		await guardarArchivoLocal(normalizadas);
		return true;
	};

	const restablecerAvance = () => {
		Alert.alert(
			"Restablecer avance",
			"Esto borrara tu progreso actual y creara un archivo limpio. ¿Deseas continuar?",
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Restablecer",
					style: "destructive",
					onPress: async () => {
						const generadas = generarEstampas();
						setEstampas(generadas);
						setTieneCambios(false);
						await guardarArchivoLocal(generadas);
					},
				},
			]
		);
	};

	useEffect(() => {
		const init = async () => {
			try {
				const generadas = generarEstampas();
				try {
					const rawHistorial = await AsyncStorage.getItem(historialKey);
					const parsedHistorial = rawHistorial ? JSON.parse(rawHistorial) : [];
					setHistorialRespaldos(Array.isArray(parsedHistorial) ? parsedHistorial : []);
				} catch (error) {
					setHistorialRespaldos([]);
				}
				if (Platform.OS === "web") {
					const raw = localStorage.getItem(almacenamientoWebKey);
					if (raw) {
						const parsed = JSON.parse(raw);
						const importadas = Array.isArray(parsed) ? parsed : parsed.estampas;
						const normalizadas = Array.isArray(importadas)
							? normalizarImportadas(importadas)
							: generadas;
						setEstampas(normalizadas);
						setTieneCambios(false);
					} else {
						setEstampas(generadas);
						setTieneCambios(false);
						await guardarArchivoLocal(generadas);
						if (!avisoMostrado) {
							Alert.alert(
								"Archivo local creado",
								"No hay avance guardado. Puedes exportar este archivo si lo usaras en otro dispositivo."
							);
							setAvisoMostrado(true);
						}
					}
					setListo(true);
					return;
				}
				let raw = null;
				try {
					raw = await AsyncStorage.getItem(almacenamientoAsyncKey);
				} catch (error) {
					raw = null;
				}
				if (!raw && FileSystem.documentDirectory) {
					const info = await FileSystem.getInfoAsync(archivoLocal);
					if (info.exists) {
						raw = await FileSystem.readAsStringAsync(archivoLocal, {
							encoding: FileSystem.EncodingType.UTF8,
						});
						if (raw) {
							try {
								await AsyncStorage.setItem(almacenamientoAsyncKey, raw);
							} catch (error) {
								// Si falla, se usa el raw de todas formas.
							}
						}
					}
				}
				if (raw) {
					const parsed = JSON.parse(raw);
					const importadas = Array.isArray(parsed) ? parsed : parsed.estampas;
					const normalizadas = Array.isArray(importadas)
						? normalizarImportadas(importadas)
						: generadas;
					setEstampas(normalizadas);
					setTieneCambios(false);
					setUltimoGuardadoEn(parsed.actualizadoEn ?? null);
				} else {
					setEstampas(generadas);
					setTieneCambios(false);
					await guardarArchivoLocal(generadas);
					if (!avisoMostrado) {
						Alert.alert(
							"Archivo local creado",
							"No hay avance guardado. Puedes exportar este archivo si lo usaras en otro dispositivo."
						);
						setAvisoMostrado(true);
					}
				}
				setListo(true);
			} catch (error) {
				const generadas = generarEstampas();
				setEstampas(generadas);
				setTieneCambios(false);
				setListo(true);
			}
		};

		init();
	}, []);

	const actualizarEstampa = (id, actualizador) => {
		setEstampas((actuales) =>
			actuales.map((estampa) => {
				if (estampa.id !== id) {
					return estampa;
				}
				const actualizada = actualizador(estampa);
				return {
					...actualizada,
					actualizadoEn: new Date().toISOString(),
				};
			})
		);
		setTieneCambios(true);
	};

	useEffect(() => {
		if (!listo) {
			return;
		}
		guardarArchivoLocal(estampas);
	}, [estampas, listo]);

	if (!listo || !fuentesCargadas) {
		return (
			<SafeAreaProvider>
				<View style={styles.loading}>
					<Text style={styles.loadingText}>Cargando...</Text>
				</View>
			</SafeAreaProvider>
		);
	}

	return (
		<SafeAreaProvider>
			<View style={styles.container}>
				<StatusBar style="auto" />
				<MainNavigator
					estampas={estampas}
					actualizarEstampa={actualizarEstampa}
					compartirAvanceTexto={compartirAvanceTexto}
					copiarAvanceTexto={copiarAvanceTexto}
					importarDesdeTexto={importarDesdeTexto}
					historialRespaldos={historialRespaldos}
					restaurarDesdeHistorial={restaurarDesdeHistorial}
					tieneCambios={tieneCambios}
					ultimoGuardadoEn={ultimoGuardadoEn}
					restablecerAvance={restablecerAvance}
				/>
			</View>
		</SafeAreaProvider>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f8fafc",
	},
	loading: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#f8fafc",
	},
	loadingText: {
		fontSize: 16,
		color: "#475569",
		fontFamily: "SpaceGrotesk_500Medium",
	},
});
