import React, { Component, type ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Icon name="alert-circle-outline" size={64} color="#E53E3E" />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.subtitle}>
            The app encountered an unexpected error.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F7F8FC",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A202C",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 14,
    color: "#718096",
    marginTop: 8,
    textAlign: "center",
  },
  button: {
    marginTop: 24,
    backgroundColor: "#4361EE",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});
