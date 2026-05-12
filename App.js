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
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
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
	exportarAvance,
	importarAvance,
	tieneCambios,
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
							exportarAvance={exportarAvance}
							importarAvance={importarAvance}
							tieneCambios={tieneCambios}
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
	const archivoLocal = `${FileSystem.documentDirectory}arka-estampas.json`;
	const almacenamientoWebKey = "arka.estampas.local";
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
			return;
		}
		if (!FileSystem.documentDirectory) {
			return;
		}
		await FileSystem.writeAsStringAsync(archivoLocal, JSON.stringify(payload), {
			encoding: FileSystem.EncodingType.UTF8,
		});
	};

	const exportarAvance = async () => {
		try {
			const now = new Date();
			const nombre = `arka-estampas-${now.toISOString().replace(/[:.]/g, "-")}.json`;
			const payload = {
				version: 1,
				exportadoEn: now.toISOString(),
				estampas,
			};
			if (Platform.OS === "android") {
				try {
					const saf = FileSystem.StorageAccessFramework;
					if (saf?.requestDirectoryPermissionsAsync) {
						const permiso = await saf.requestDirectoryPermissionsAsync();
						if (permiso.granted) {
							const fileUri = await saf.createFileAsync(
								permiso.directoryUri,
								nombre,
								"application/json"
							);
							await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(payload), {
								encoding: FileSystem.EncodingType.UTF8,
							});
							Alert.alert("Exportacion lista", "Archivo guardado en la carpeta elegida.");
							setTieneCambios(false);
							return;
						}
					}
				} catch (error) {
					// En Expo Go puede fallar SAF; se usa el flujo de compartir.
				}
			}

			const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
			if (!baseDir) {
				Alert.alert(
					"Exportacion",
					"No se encontro un directorio para exportar."
				);
				return;
			}
			const uri = `${baseDir}${nombre}`;
			await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload), {
				encoding: FileSystem.EncodingType.UTF8,
			});

			const disponible = await Sharing.isAvailableAsync();
			if (disponible) {
				await Sharing.shareAsync(uri, {
					mimeType: "application/json",
					dialogTitle: "Exportar avance",
				});
				setTieneCambios(false);
			} else {
				Alert.alert("Exportacion lista", `Archivo guardado en: ${uri}`);
				setTieneCambios(false);
			}
		} catch (error) {
			Alert.alert("Error", "No se pudo exportar el avance.");
		}
	};

	const importarAvance = async () => {
		try {
			const resultado = await DocumentPicker.getDocumentAsync({
				copyToCacheDirectory: true,
				type: "application/json",
			});
			if (resultado.canceled) {
				return;
			}
			const uri = resultado.assets?.[0]?.uri ?? resultado.uri;
			if (!uri) {
				Alert.alert("Importacion", "No se encontro el archivo.");
				return;
			}
			const raw = await FileSystem.readAsStringAsync(uri, {
				encoding: FileSystem.EncodingType.UTF8,
			});
			const parsed = JSON.parse(raw);
			const importadas = Array.isArray(parsed) ? parsed : parsed.estampas;
			if (!Array.isArray(importadas)) {
				Alert.alert("Importacion", "El archivo no tiene un formato valido.");
				return;
			}
			const normalizadas = normalizarImportadas(importadas);
			setEstampas(normalizadas);
			setTieneCambios(false);
			await guardarArchivoLocal(normalizadas);
			Alert.alert("Importacion lista", "Avance restaurado correctamente.");
		} catch (error) {
			Alert.alert("Error", "No se pudo importar el avance.");
		}
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
				if (!FileSystem.documentDirectory) {
					setEstampas(generadas);
					setTieneCambios(false);
					setListo(true);
					return;
				}
				const info = await FileSystem.getInfoAsync(archivoLocal);
				if (info.exists) {
					const raw = await FileSystem.readAsStringAsync(archivoLocal, {
						encoding: FileSystem.EncodingType.UTF8,
					});
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
					exportarAvance={exportarAvance}
					importarAvance={importarAvance}
					tieneCambios={tieneCambios}
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