// src/components/TimerControls.js
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import styles from "../styles/StudyTimerStyles";

const TimerControls = React.memo(
  ({
    timerState,
    selectedMethod,
    startTimer,
    pauseTimer,
    stopTimer,
    toggleLandscapeMode,
  }) => (
    <View style={styles.timerControlsContainer}>
      <View style={styles.timerControlsBar}>
        {timerState === "working" || timerState === "break" ? (
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: selectedMethod.color },
            ]}
            onPress={pauseTimer}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.7}
          >
            <Ionicons name="pause" size={24} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: selectedMethod.color },
            ]}
            onPress={startTimer}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.7}
          >
            <Ionicons name="play" size={24} color="#ffffff" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.controlButton,
            {
              backgroundColor: "#ff6b6b",
              opacity: timerState !== "idle" ? 1 : 0,
            },
          ]}
          onPress={stopTimer}
          disabled={timerState === "idle"}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          activeOpacity={0.7}
        >
          <Ionicons name="stop" size={24} color="#ffffff" />
        </TouchableOpacity>

        {timerState === "working" || timerState === "break" ? (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: "#666" }]}
            onPress={toggleLandscapeMode}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            activeOpacity={0.7}
          >
            <Ionicons name="scan-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.controlButton,
              { backgroundColor: "#666", opacity: 0 },
            ]}
            disabled
          >
            <Ionicons name="scan-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
);

export default TimerControls;
