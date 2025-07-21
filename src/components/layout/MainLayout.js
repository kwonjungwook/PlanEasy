// src/components/layout/MainLayout.js
import { Platform, SafeAreaView, StyleSheet, View } from "react-native";
import CategoryTabs from "./CategoryTabs";

const MainLayout = ({
  children,
  navigation,
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {children}

        {/* 하단 탭 네비게이션 (CategoryTabs 호출) */}
        {activeCategory && onSelectCategory && (
          <View style={styles.tabContainer}>
            <CategoryTabs
              activeCategory={activeCategory}
              onSelectCategory={onSelectCategory}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  tabContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingBottom: Platform.OS === "ios" ? 20 : 0, // iOS에서 하단 패딩 추가
  },
});

export default MainLayout;
