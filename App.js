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
import { StyleSheet, Text, View } from "react-native";
import { generarEstampas } from "./src/data/stickers";
import AlbumScreen from "./src/screens/AlbumScreen";
import HomeScreen from "./src/screens/HomeScreen";
import ProgressScreen from "./src/screens/ProgressScreen";
import RepeatsScreen from "./src/screens/RepeatsScreen";
import { cargarEstampas, guardarEstampas } from "./src/storage/stickersStore";

const Tab = createBottomTabNavigator();

export default function App() {
	const [estampas, setEstampas] = useState([]);
	const [listo, setListo] = useState(false);
	const [fuentesCargadas] = useFonts({
		SpaceGrotesk_400Regular,
		SpaceGrotesk_500Medium,
		SpaceGrotesk_700Bold,
	});

	useEffect(() => {
		const init = async () => {
			const generadas = generarEstampas();
			const codigosEsperados = new Set(generadas.map(e => e.codigo));
			
			const almacenadas = await cargarEstampas();
			const codigosGuardados = new Set(almacenadas?.map(e => e.codigo) ?? []);
			
			const tienenLosMismosCodigos = codigosEsperados.size === codigosGuardados.size &&
				[...codigosEsperados].every(c => codigosGuardados.has(c));
			
			if (almacenadas && almacenadas.length && tienenLosMismosCodigos) {
				setEstampas(almacenadas);
			} else {
				setEstampas(generadas);
				await guardarEstampas(generadas);
			}
			setListo(true);
		};

		init();
	}, []);

	useEffect(() => {
		if (!listo) {
			return;
		}
		guardarEstampas(estampas);
	}, [estampas, listo]);

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
	};

	if (!listo || !fuentesCargadas) {
		return (
			<View style={styles.loading}>
				<Text style={styles.loadingText}>Cargando...</Text>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<NavigationContainer>
				<Tab.Navigator
					sceneContainerStyle={{ backgroundColor: "#f8fafc" }}
					screenOptions={({ route }) => {
					const ocultarBarra = route.name === "Inicio";
					return {
						headerShown: false,
						tabBarActiveTintColor: "#56595e",
						tabBarInactiveTintColor: "#94a3b8",
						tabBarShowLabel: false,
						tabBarItemStyle: {
							paddingVertical: 6,
						},
						tabBarStyle: ocultarBarra
							? { display: "none" }
							: {
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "center",
								alignSelf: "center",
								width: "92%",
								paddingBottom: 10,
								paddingTop: 8,
								marginBottom: 16,
								borderWidth: 1,
								borderColor: "#e2e8f0",
								borderRadius: 20,
								backgroundColor: "#f8fafc",
								shadowOpacity: 0.10,
								shadowOffset: { width: 0, height: -4 },
								shadowRadius: 12,
								elevation: 8,
							},
						tabBarIcon: ({ color, size, focused }) => {
							let iconName = "home";
							switch (route.name) {
								case "Inicio":
									iconName = focused ? "home" : "home-outline";
									break;
								case "Mi álbum":
									iconName = focused ? "albums" : "albums-outline";
									break;
								case "Repetidas":
									iconName = focused ? "repeat" : "repeat-outline";
									break;
								case "Progreso":
									iconName = focused ? "stats-chart" : "stats-chart-outline";
									break;
								default:
									iconName = "home";
							}
							return <Ionicons name={iconName} size={22} color={color} />;
						},
					};
				}}
			>
				<Tab.Screen name="Inicio">
					{(props) => <HomeScreen {...props} estampas={estampas} />}
				</Tab.Screen>
				<Tab.Screen name="Mi álbum">
					{() => (
						<AlbumScreen estampas={estampas} actualizarEstampa={actualizarEstampa} />
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
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f8fafc"
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
