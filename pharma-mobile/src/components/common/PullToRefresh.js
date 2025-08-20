import React from "react";
import { RefreshControl, ScrollView } from "react-native";

const PullToRefresh = ({ children, onRefresh, refreshing }) => {
  return (
    <ScrollView
      style={{ flex: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#3b82f6"]}
          tintColor="#3b82f6"
        />
      }
    >
      {children}
    </ScrollView>
  );
};

export default PullToRefresh;
