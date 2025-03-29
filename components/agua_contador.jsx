import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, Button } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../utils/ThemeContext";
import { Audio } from "expo-av";
import { Asset } from "expo-asset";

const HISTORICO_AGUA = "waterHistory";
const META_DIARIA_KEY = "metaDiaria";

export default function AguaContador({ copos, setCopos }) {
  const { theme } = useTheme();
  const [soundUri, setSoundUri] = useState(null);
  const [isSoundLoaded, setIsSoundLoaded] = useState(false);
  const [metaDiaria, setMetaDiaria] = useState(8);

  useEffect(() => {
    async function loadSound() {
      try {
        const asset = Asset.fromModule(require("../assets/water.mp3"));
        await asset.downloadAsync();

        setSoundUri(asset.localUri);
        setIsSoundLoaded(true);
      } catch (e) {
        console.error("Erro ao carregar o som:", e);
      }
    }
    loadSound();
  }, []);

  useEffect(() => {
    async function loadMetaDiaria() {
      try {
        const meta = await AsyncStorage.getItem(META_DIARIA_KEY);
        if (meta) {
          setMetaDiaria(Number(meta));
        } else {
          setMetaDiaria(8);
        }
      } catch (e) {
        console.error("Erro ao carregar a meta diária:", e);
      }
    }
    loadMetaDiaria();
  }, []);

  useEffect(() => {
    async function updateMetaDiaria() {
      try {
        await AsyncStorage.setItem(META_DIARIA_KEY, metaDiaria.toString());
      } catch (e) {
        console.error("Erro ao salvar a meta diária:", e);
      }
    }
    updateMetaDiaria();
  }, [metaDiaria]);

  const adicionar = async () => {
    if (!isSoundLoaded || !soundUri) {
      console.error("Áudio ainda não foi carregado completamente. Tente novamente!");
      return;
    }

    let soundInstance;
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: soundUri });
      soundInstance = sound;
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();
        }
      });

      const dtAtual = new Date().toLocaleDateString("pt-BR");
      setCopos((prevCopos) => prevCopos + 1);

      const historico = await AsyncStorage.getItem(HISTORICO_AGUA);
      const lista = historico ? JSON.parse(historico) : [];
      const coposHoje = lista.find((entry) => entry.date === dtAtual);
      if (coposHoje) {
        coposHoje.count += 1;
      } else {
        lista.push({ date: dtAtual, count: 1 });
      }
      await AsyncStorage.setItem(HISTORICO_AGUA, JSON.stringify(lista));
    } catch (e) {
      console.error("Erro ao salvar histórico ou tocar som:", e);
    }
  };

  return (
    <View style={[styles.counterCard, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.cardContent}>
        <Text style={[styles.counterText, { color: theme.primaryDark }]}>
          Copos Hoje
        </Text>
        <Button
          title={isSoundLoaded ? "Bebi um copo!" : "Carregando áudio..."}
          onPress={adicionar}
          color={theme.primary}
          disabled={!isSoundLoaded}
        />
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.counter}>
          {copos} / {metaDiaria} 💧
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  counterCard: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardContent: {
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  counter: {
    fontSize: 46,
    fontWeight: "bold",
  },
  counterText: {
    fontSize: 24,
    fontWeight: "600",
  },
  cardFooter: {
    marginTop: 10,
    alignItems: "center",
  },
});