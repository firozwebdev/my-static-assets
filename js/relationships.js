$(document).ready(function () {
    //window.relationships = [];
    let selectedRelationshipIndex = null;
    
  
  
    $("#relatedModel").on("input", function () {
      if ($(this).val().trim() === "") {
          $(this).addClass("is-invalid");
      } else {
          $(this).removeClass("is-invalid");
      }
    });
  
      $("#relationshipType").change(function () {
          if ($(this).val() === "") {
              $(this).addClass("is-invalid");
          } else {
              $(this).removeClass("is-invalid");
          }
      });
    // Function to validate table name and columns
    function validateTableAndColumns() {
      //if(!isValidTableName($("#tableName").val().trim())) return;
      tableName = $("#tableName").val().trim(); // Get updated table name
      let columnCount = $("#columnsList li").length; // Count existing columns
  
      if (!tableName) {
        showCustomAlert("Please set the Model name first in the sidebar!");
        disableActionsForRelationships();
        return false;
      }
  
      if (columnCount < 2) {
        showCustomAlert("At least two columns are required!");
        disableActionsForRelationships();
        return false;
      }
  
      enableActionsForRelationships();
      return true;
    }
  
    // Disable actions until conditions are met
    function disableActionsForRelationships() {
      $("#addRelationshipBtn, #relatedModel, #relationshipType,.remove-btn-column").prop("disabled", true);
    }
  
    // Enable actions once conditions are met
    function enableActionsForRelationships() {
      $("#addRelationshipBtn, #relatedModel, #relationshipType,.remove-btn-column").prop("disabled", false);
    }
  
    // Update Relationship Sidebar
    function updateRelationshipSidebar() {
      //if(!isValidTableName($("#tableName").val().trim())) return;
      tableName =  $("#tableName").val().trim();
      if (!tableName) {
          showCustomAlert("Please set the Model name first in the sidebar!");
          return;
      }
  
      $("#relationshipsList").empty();
  
      relationships.forEach((rel, index) => {
        const isActive = selectedRelationshipIndex === index ? "active" : "";
  
        $("#relationshipsList").append(`
          <li class="list-group-item-relationship ${isActive}" data-index="${index}">
            ${rel.relatedModel || "Untitled Relationship"}
            <button class="remove-btn-relationship btn btn-danger btn-sm float-end" data-index="${index}">
                <i class="bi bi-x-circle"></i> 
            </button>
          </li>
        `);
      });
  
      setTimeout(() => {
        $(`li.list-group-item-relationship[data-index="${selectedRelationshipIndex}"]`).addClass("active");
      }, 10);
    }
  
    // Load Relationship Data in Detail Panel
    function loadRelationshipData() {
      if (selectedRelationshipIndex === null) return;
      const relationship = relationships[selectedRelationshipIndex];
  
      $("#columnDetail").hide();
      $("#relationshipDetail").show();
      $("#relatedModel").val(relationship.relatedModel || "");
      $("#relationshipType").val(relationship.type || "");
    }
  
    // Save Relationship Data
    function saveRelationshipData() {
      if (selectedRelationshipIndex === null) return false;
  
      const relationship = relationships[selectedRelationshipIndex];
       // Convert to lowercase for comparison
      //if(!isValidTableName($("#relatedModel").val().trim())) return;
      const relatedModel = formatModelName($("#relatedModel").val().trim().toLowerCase());  // Convert to lowercase for comparison
      const relationshipType = $("#relationshipType").val();
      let isValid = true;
  
      // Check if the related model already exists (case-insensitive) excluding the current relationship
      if (relationships.some((rel, index) => formatModelName(rel.relatedModel?.toLowerCase()) === relatedModel && index !== selectedRelationshipIndex)) {
          showCustomAlert("Related model name already exists. Please choose a unique model!");
          $("#relatedModel").addClass("is-invalid"); // Highlight the field in red
          isValid = false;
      } else {
          $("#relatedModel").removeClass("is-invalid");
      }
  
      // Validate Related Model
      if (!relatedModel) {
          showCustomAlert("Related model is required!");
          $("#relatedModel").addClass("is-invalid");
          isValid = false;
      } else {
          $("#relatedModel").removeClass("is-invalid");
      }
  
      // Validate Relationship Type
      if (!relationshipType) {
          showCustomAlert("Relationship type is required!");
          $("#relationshipType").addClass("is-invalid");
          isValid = false;
      } else {
          $("#relationshipType").removeClass("is-invalid");
      }
  
      // If validation fails, return false
      if (!isValid) return false;
  
      // Save relationship data if validation passes
      relationship.relatedModel = relatedModel;
      relationship.type = relationshipType;
      updateRelationshipSidebar();
  
      return true; // Indicate successful save
    }
  
  
    // Add Relationship
    $("#addRelationshipBtn").click(function (e) {
      //if(!isValidTableName($("#tableName").val().trim())) return;
      tableName =  $("#tableName").val().trim();
      if (!tableName) {
          showCustomAlert("Please set the Model name first in the sidebar!");
          return;
      }
  
      let columns = window.columns;
  
      if (columns.length > 0) {
        if (!isDefaultValueConsistentOrNotInColumn(columns)) {
            //showCustomAlert("Please fix  default value!");
            return;
        }
      }
  
      if(relationships.length > 0){
        if(!validateRelatedModels(relationships)){
          return;
        }
      }
      
      // Ensure columns exist and take the first column
      let firstColumnKey = Object.keys(columns)[0];
      let firstColumn = columns[firstColumnKey];
  
      // Validate first column existence and properties
      if (!firstColumn || !firstColumn.name?.trim() || firstColumn.name === "Untitled Column" || !firstColumn.type) {
          showCustomAlert("Please complete column details first!");
          return;
      }
  
     
  
      // Validate and save the current relationship before adding a new one
      if (selectedRelationshipIndex !== null && !saveRelationshipData()) {
          return; // Stop if validation fails
      }
  
      // Add a new empty relationship at the beginning
      relationships.unshift({ relatedModel: "", type: "" });
      selectedRelationshipIndex = 0; // Select the new relationship
  
      updateRelationshipSidebar();
      loadRelationshipData();
      if(relationships.length <= 1){
        showToast("Input relationship details!");
      }else{
        showToast("Relationship saved successfully!");
      }
      //showToast(relationships.length > 1 ? "Relationship saved successfully!" : "Input relationship details!");
  });
  
  
    // Set Table/Model Name
    $("#setTableNameBtn").click(function () {
      //if(!isValidTableName($("#tableName").val().trim())) return;
      tableName =  $("#tableName").val().trim();
      $("h5 span.tableModelName").text(tableName);
      
      // if table name is set, and columns are greater than 1, enable the add relationship button
      if ($("#columnsList li").length > 1) {
        enableActionsForRelationships();
      }else{
        disableActionsForRelationships();
      }
    });
  
    // Relationship Click Event (Using Event Delegation)
    $(document).on("click", "li.list-group-item-relationship", function () {
      saveRelationshipData();
      $("li.list-group-item-column").removeClass("active");
      $("li.list-group-item-relationship").removeClass("active");
      $(this).addClass("active");
  
      selectedRelationshipIndex = $(this).data("index");
      setTimeout(() => {
        loadRelationshipData();
      }, 10);
    });
  
    // Relationship Name Input Change
    $("#relatedModel").on("input", function () {
      if (selectedRelationshipIndex !== null) {
        relationships[selectedRelationshipIndex].relatedModel = $(this).val();
        updateRelationshipSidebar();
      }
    });
  
    // Relationship Type Change
    $("#relationshipType").change(function () {
      if (selectedRelationshipIndex !== null) {
        saveRelationshipData();
        relationships[selectedRelationshipIndex].type = $(this).val();
      }
    });
  
    // Remove Relationship
    $(document).on("click", ".remove-btn-relationship", function (event) {
      event.stopPropagation();
      const relationshipIndex = $(this).closest(".list-group-item-relationship").data("index");
  
      if (relationshipIndex !== undefined) {
        relationships.splice(relationshipIndex, 1);
        selectedRelationshipIndex = relationships.length > 0 ? 0 : null;
        updateRelationshipSidebar();
        relationships.length > 0 ? loadRelationshipData() : $("#relationshipDetail").hide();
  
        showToast("Relationship removed successfully!");
      }
    });
  
    // Toggle "Set Table Name" Button
    function toggleSetTableNameBtn() {
      //if(!isValidTableName($("#tableName").val().trim())) return;
      $("#setTableNameBtn").prop("disabled", $("#tableName").val().trim() === "");
    }
  
    // Column Add Event (No validation here)
    $("#addColumnBtn").click(function () {
      // check column length if it is grater than 1, then enable the add relationship button
      if ($("#columnsList li").length > 1) {
        enableActionsForRelationships();
        
      }else{
        disableActionsForRelationships();
      }
     
  
    });
  
    // Column Remove Event (Using Delegation)
    $(document).on("click", ".remove-btn-column", function () {
      // check column length if it is grater than 1, then enable the add relationship button
      if ($("#columnsList li").length > 1) {
        enableActionsForRelationships();
      }else{
        disableActionsForRelationships();
      }
    });
  
    // Initial Setup
    $("#relationshipDetail").hide();
    toggleSetTableNameBtn();
    disableActionsForRelationships();
    updateRelationshipSidebar();
  
    // Table Name Input Change
    $("#tableName").on("input", toggleSetTableNameBtn);
   
  
    
  });
  