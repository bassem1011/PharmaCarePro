import React, { useState, useRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Text,
  Modal,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const SearchBar = ({
  onSearch,
  onFilter,
  placeholder = "البحث...",
  filters = [],
  style,
}) => {
  const [searchText, setSearchText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({});

  const animatedWidth = useRef(new Animated.Value(0)).current;
  const searchIconOpacity = useRef(new Animated.Value(1)).current;

  const handleFocus = () => {
    setIsFocused(true);
    Animated.parallel([
      Animated.timing(animatedWidth, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(searchIconOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.parallel([
      Animated.timing(animatedWidth, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(searchIconOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSearch = (text) => {
    setSearchText(text);
    onSearch && onSearch(text, selectedFilters);
  };

  const handleFilterToggle = (filterKey) => {
    const newFilters = {
      ...selectedFilters,
      [filterKey]: !selectedFilters[filterKey],
    };
    setSelectedFilters(newFilters);
    onSearch && onSearch(searchText, newFilters);
  };

  const clearSearch = () => {
    setSearchText("");
    setSelectedFilters({});
    onSearch && onSearch("", {});
  };

  const activeFiltersCount =
    Object.values(selectedFilters).filter(Boolean).length;

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchContainer}>
        <Animated.View
          style={[
            styles.searchIcon,
            {
              opacity: searchIconOpacity,
            },
          ]}
        >
          <MaterialCommunityIcons name="magnify" size={20} color="#6c757d" />
        </Animated.View>

        <TextInput
          style={[styles.input, isFocused && styles.inputFocused]}
          placeholder={placeholder}
          placeholderTextColor="#6c757d"
          value={searchText}
          onChangeText={handleSearch}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType="search"
        />

        {searchText.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color="#6c757d"
            />
          </TouchableOpacity>
        )}

        {filters.length > 0 && (
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            style={[
              styles.filterButton,
              activeFiltersCount > 0 && styles.filterButtonActive,
            ]}
          >
            <MaterialCommunityIcons
              name="filter-variant"
              size={20}
              color={activeFiltersCount > 0 ? "#ffffff" : "#6c757d"}
            />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>الفلاتر</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#6c757d"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.filtersList}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterItem,
                    selectedFilters[filter.key] && styles.filterItemActive,
                  ]}
                  onPress={() => handleFilterToggle(filter.key)}
                >
                  <MaterialCommunityIcons
                    name={
                      selectedFilters[filter.key]
                        ? "check-circle"
                        : "circle-outline"
                    }
                    size={20}
                    color={selectedFilters[filter.key] ? "#007bff" : "#6c757d"}
                  />
                  <Text
                    style={[
                      styles.filterText,
                      selectedFilters[filter.key] && styles.filterTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setSelectedFilters({});
                  onSearch && onSearch(searchText, {});
                  setShowFilters(false);
                }}
              >
                <Text style={styles.clearFiltersText}>مسح الفلاتر</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#212529",
    textAlign: "right",
  },
  inputFocused: {
    borderColor: "#007bff",
  },
  clearButton: {
    marginLeft: 8,
  },
  filterButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 6,
    position: "relative",
  },
  filterButtonActive: {
    backgroundColor: "#007bff",
  },
  filterBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#dc3545",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
  },
  filtersList: {
    marginBottom: 20,
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterItemActive: {
    backgroundColor: "#e3f2fd",
  },
  filterText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#6c757d",
  },
  filterTextActive: {
    color: "#007bff",
    fontWeight: "500",
  },
  modalFooter: {
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    paddingTop: 16,
  },
  clearFiltersButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  clearFiltersText: {
    color: "#dc3545",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default SearchBar;
