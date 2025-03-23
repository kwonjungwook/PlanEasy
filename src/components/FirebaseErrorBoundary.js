// src/components/FirebaseErrorBoundary.js
import React from "react";
import { View, Text, Button } from "react-native";

class FirebaseErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Firebase error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20 }}>
            오류가 발생했습니다
          </Text>
          <Text style={{ marginBottom: 20 }}>
            {this.state.error?.message || "알 수 없는 오류가 발생했습니다"}
          </Text>
          <Button
            title="다시 시도"
            onPress={() => this.setState({ hasError: false })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

export default FirebaseErrorBoundary;
