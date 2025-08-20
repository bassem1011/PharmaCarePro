import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");
const SWIPE_THRESHOLD = 80;

const SwipeableItem = ({
  children,
  onEdit,
  onDelete,
  onView,
  editIcon = "pencil",
  deleteIcon = "delete",
  viewIcon = "eye",
  editColor = "#007bff",
  deleteColor = "#dc3545",
  viewColor = "#28a745",
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const actionWidth = 80;

  const handleSwipe = (direction) => {
    const toValue = direction === "right" ? -actionWidth * 2 : 0;

    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handleAction = (action) => {
    // Reset position
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();

    // Execute action
    switch (action) {
      case "edit":
        onEdit && onEdit();
        break;
      case "delete":
        onDelete && onDelete();
        break;
      case "view":
        onView && onView();
        break;
    }
  };

  const renderActionButton = (icon, color, action, position) => (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: color },
        position === "left" ? styles.leftAction : styles.rightAction,
      ]}
      onPress={() => handleAction(action)}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons name={icon} size={20} color="#ffffff" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {onView && renderActionButton(viewIcon, viewColor, "view", "left")}
        {onEdit && renderActionButton(editIcon, editColor, "edit", "right")}
        {onDelete &&
          renderActionButton(deleteIcon, deleteColor, "delete", "right")}
      </View>

      {/* Main Content */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.touchable}
          onLongPress={() => handleSwipe("right")}
          activeOpacity={0.9}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    marginVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  actionContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1,
  },
  actionButton: {
    width: 80,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  leftAction: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  rightAction: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  content: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  touchable: {
    padding: 16,
  },
});

export default SwipeableItem;
