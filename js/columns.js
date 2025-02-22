$(document).ready(function () {
    // window.tableName = "";
    // window.columns = [];
    let selectedColumnIndex = null;
    //$("#generateBtn").prop("disabled", true);
    $('input[name="multiple_img"]').prop('disabled', true);

  
    $("#columnName").on("input", function () {
      if ($(this).val().trim() === "") {
          $(this).addClass("is-invalid");
      } else {
          $(this).removeClass("is-invalid");
      }
    });
  
      $("#dataType").change(function () {
          if ($(this).val() === "") {
              $(this).addClass("is-invalid");
          } else {
              $(this).removeClass("is-invalid");
          }
      });
  
  
    // Disable actions until the table name is set
    function disableActions() {
        $("#addColumnBtn, #columnName, #dataType, .additional-input, #generateBtn").prop("disabled", true);  // Disable column-related actions
        $(".remove-btn-column").prop("disabled", true);  // Disable column removal actions
    }
  
    // Enable actions once the table name is set
    function enableActions() {
        $("#addColumnBtn, #columnName, #dataType, .additional-input").prop("disabled", false);  // Enable column-related actions
        $(".remove-btn-column").prop("disabled", false);  // Enable column removal actions
    }
  
  
  
  function checkTableName() {
    //if(!isValidTableName($("#tableName").val().trim())) return;
      tableName = $("#tableName").val().trim(); // Get the table name
      if (!tableName) {
          showCustomAlert("Please set the Model name first in the sidebar.");
          disableActions();
          return false;
      }
      return true;
    } 
  
  
  
    // Function to update the sidebar
    function updateSidebar() {
        if (!checkTableName()) return;  // Only proceed if the table name is set
        $("#columnsList").empty();
        columns.forEach((col, index) => {
            $("#columnsList").append(`
                <li class="list-group-item-column ${selectedColumnIndex === index ? "active" : ""}" data-index="${index}">
                    ${col.name || "Untitled Column"}
                    <button class="remove-btn-column btn btn-danger btn-sm float-end" data-index="${index}">
                        <i class="bi bi-x-circle"></i>
                    </button>
                </li>
            `);
        });
  
        // Reattach event listeners after updating the list
        $(".list-group-item-column").off("click").on("click", function () {
            saveColumnData();
            $(".list-group-item-column").removeClass("active");
            $(".list-group-item-relationship").removeClass("active");
            $(this).addClass("active");
            selectedColumnIndex = $(this).data("index");
            loadColumnDetails();
        });
    }
  
    // Function to load column details in the right panel
    function loadColumnDetails() {
        if (selectedColumnIndex === null) return;
        const column = columns[selectedColumnIndex];
  
        // Ensure the details panel is visible when a column is selected
        $("#columnDetail").show();
        $("#relationshipDetail").hide();
        $("#columnName").val(column.name || "");
        $("#dataType").val(column.type || "");
  
        // Ensure nullable is set to false if undefined
        column.nullable = column.nullable !== undefined ? column.nullable : false;
  
        showAdditionalFields(column.type, column);
    }
    function showAdditionalFields(dataType, column = {}) {
        let additionalHTML = "";
    
        // Ensure unique is always true/false
        let isUnique = !!(column.unique && column.unique !== "off");
    
        // Add additional fields based on the data type
        if (dataType === "string") {
            additionalHTML += `
                <div class="mb-3">
                    <label for="length" class="form-label">Length</label>
                    <input type="number" class="form-control additional-input str-length" placeholder="Optional. Any number between 1 to 255" data-key="length" value="${column.length || ""}">
                </div>
            `;
        } else if (dataType === "decimal") {
            additionalHTML += `
                <div class="mb-3">
                    <label for="precision" class="form-label">Precision</label>
                    <input type="number" class="form-control additional-input" placeholder="Required. Any number between 1 to 65" data-key="precision" value="${column.precision || ""}">
                </div>
                <div class="mb-3">
                    <label for="scale" class="form-label">Scale</label>
                    <input type="number" class="form-control additional-input" placeholder="Required. Any number between 1 to 30"  data-key="scale" value="${column.scale || ""}">
                </div>
            `;
        } else if (["enum", "options"].includes(dataType)) {
            const optionsValue = column.options || "Option1,Option2";
            additionalHTML += `
                <div class="mb-3">
                    <label for="optionsList" class="form-label">Options (comma separated)</label>
                    <input type="text" class="form-control additional-input" data-key="options" value="${optionsValue}">
                </div>
                <div class="mb-3">
                    <label for="defaultValue" class="form-label">Default Value</label>
                    <select class="form-control additional-input" data-key="default">
                        ${generateOptionsDropdown(optionsValue, column.default)}
                    </select>
                </div>
            `;
        }
    
        // Add input box to Default Value for all data types except excluded ones
        if (!["enum", "options", "image", "bigIncrements", "uuid", "foreignId"].includes(dataType)) {
            let inputType = "text"; // Default to text input

            if (dataType === "date") {
                inputType = "date"; // Use date picker for date type
            } else if (["integer", "decimal"].includes(dataType)) {
                inputType = "number"; // Use number input for integer and decimal
            }

            additionalHTML += `
                <div class="mb-3">
                    <label for="defaultValue" class="form-label">Default Value</label>
                    <input type="${inputType}" class="form-control additional-input default-value" 
                        data-key="default" value="${column.default || ''}" 
                        ${dataType === "decimal" ? 'step="0.01"' : 'step="1"'}>
                </div>
            `;
        }


    
        // Add nullable and unique checkboxes for all types except excluded ones
        if (!["bigIncrements", "uuid", "foreignId", "enum", "options"].includes(dataType)) {
            additionalHTML += `<div class="mb-3 d-flex align-items-center gap-3">`;

            // Add Nullable Checkbox (applies to all types)
            additionalHTML += `
                <div class="form-check" ${column.default ? 'style="pointer-events:none;"' : ""}>
                    <input type="checkbox" class="form-check-input additional-input" id="nullable-${column.name}" data-key="nullable" ${column.nullable ? "checked" : ""} ${column.default ? "disabled" : ""}>
                    <label class="form-check-label" for="nullable-${column.name}">Nullable</label>
                </div>`;

            // Add Unique Checkbox (skip if type is "image")
            if (dataType !== "image") {
                additionalHTML += `
                    <div class="form-check">
                        <input type="checkbox" class="form-check-input additional-input" id="unique-${column.name}" data-key="unique" ${isUnique ? "checked" : ""}>
                        <label class="form-check-label" for="unique-${column.name}">Unique</label>
                    </div>`;
            }

            additionalHTML += `</div>`; // Close the div wrapper
        }


    
        // Render the HTML for additional fields
        $("#additionalFields").html(additionalHTML);
    
        // Handle interaction between Default Value and Nullable Checkbox
        $("input[data-key='default']").on("input", function() {
            const defaultValue = $(this).val();
            const nullableCheckbox = $(`#nullable-${column.name}`);

            if (String(defaultValue).trim() !== "") {  // Convert value to string before trimming
                nullableCheckbox.prop("disabled", true); // Disable nullable checkbox
                nullableCheckbox.prop("checked", false); // Uncheck nullable if default value is provided
            } else {
                nullableCheckbox.prop("disabled", false); // Enable nullable checkbox
            }
        });

    }
    
    

  
    // Generate dropdown options from comma separated values
    function generateOptionsDropdown(optionsStr, defaultValue) {
        const optionsArray = optionsStr.split(',').map(option => option.trim());
        return optionsArray.map(option => {
            return `<option value="${option}" ${option === defaultValue ? "selected" : ""}>${option}</option>`;
        }).join('');
    }
  
    // Update the "Default Value" dropdown based on options input
    function updateDefaultValueDropdown(optionsStr) {
        const optionsArray = optionsStr.split(',').map(option => option.trim());
        const defaultValueDropdown = $("select[data-key='default']");
        defaultValueDropdown.empty(); // Clear the existing options
  
        // Populate the dropdown with the updated options
        optionsArray.forEach(option => {
            defaultValueDropdown.append(`<option value="${option}">${option}</option>`);
        });
    }
  
    
    function saveColumnData() {
        if (selectedColumnIndex === null || selectedColumnIndex < 0 || selectedColumnIndex >= columns.length) {
            return false; // Ensure index is valid
        }
    
        const column = columns[selectedColumnIndex];
        let columnName = $("#columnName").val().trim();
    
        const newColumnName = columnName.toLowerCase(); 
    
        // Check if column name already exists (case-insensitive)
        if (columns.some((col, index) => index !== selectedColumnIndex && col.name.toLowerCase() === newColumnName)) {
            showCustomAlert("Column name already exists. Please choose a unique name.");
            $("#columnName").addClass("is-invalid");
            return false;
        }
    
        column.name = newColumnName;
        column.type = $("#dataType").val().trim();
    
        // Validate input type
        //if(!isValidInput(column.type)) return false;

        if (!column.type) {
            showCustomAlert("Data type is required.");
            $("#dataType").addClass("is-invalid");
            return false;
        } else {
            $("#dataType").removeClass("is-invalid");
        }
    
        // Process additional input fields dynamically
        $(".additional-input").each(function () {
            const key = $(this).data("key");
    
            if ($(this).is(":checkbox")) {
                column[key] = $(this).prop("checked"); // Store as true/false
            } else {
                column[key] = $(this).val().trim();
            }
        });
        
        return true; 
    }
    
    
     // Add a new column when the "Add Column" button is clicked
      $("#addColumnBtn").click(function (e) {
          if (!checkTableName()) {
              showCustomAlert("Please set the Model name first!");
              return; 
          }
          $('#detailPanel').show();
          relationships = window.relationships;
          columns = window.columns;
         
        
        if (columns.length > 0) {
            if (!isDefaultValueConsistentOrNotInColumn(columns)) {
                //showCustomAlert("Please fix  default value!");
                return;
            }
            if (!isValidInput(columns)) {
                return;
            }
        }       
        
        if(columns.length >= 1){
            $("#generateBtn").prop("disabled", false);
            $('input[name="multiple_img"]').prop('disabled', false);

        }

      
          // get first relationship  and check if it's relatedMOdel or type is empty
          if(relationships.length > 0){
            let firstRelationship = relationships[0];
            let relatedModel = firstRelationship?.relatedModel || "";
            let type = firstRelationship?.type || "";
            if (relatedModel.trim() === "" || type.trim() === "") {
                showCustomAlert("Please complete relationship details first!");
                return;
            }else{
                console.log(e);
                showToast("Relationship saved successfully!");
            }
          }
          // Validate before adding a new column
          if (selectedColumnIndex !== null && !saveColumnData()) {
              return; // Stop if validation fails
          }
      
          columns.unshift({ name: "", type: "", options: "" }); // Add column at the beginning
          selectedColumnIndex = 0 // Select the new column
          updateSidebar();
          loadColumnDetails();
          if(columns.length <= 1){
            showToast("Input column details!");
          }else{
            showToast("Column saved successfully!");
          }
        //   showToast(columns.length < 1 ? "Input column details!" : "");
      });
      
  
    
    
  
    // Set the table/model name
    $("#setTableNameBtn").click(function () {
        let tableName = $("#tableName").val().trim();
    
        // Validate the table name
        if (!isValidTableName(tableName)) return;
    
        if (!tableName) {
            showCustomAlert("Please set the Model name first in the sidebar!");
            return;
        }
    
        // Check if the model name is already set
        if ($(this).prop("disabled")) {
            showCustomAlert("Model name is already set!");
            return;
        }
    
        // Update UI elements
        $("h5 span.tableModelName").text(tableName);
        $(this).prop("disabled", true); // Correct method to disable the button
    
        enableActions();  // Enable actions once the table name is set
        showToast("Model Name Set Successfully!");
    });

    $(document).on('input', ".additional-input", function () {
        let key = $(this).data("key"); // Get the data-key attribute (length, precision, scale)
        let maxValues = { length: 255, precision: 65, scale: 30 }; // Define max limits
        let minValue = 1; // Minimum allowed value
    
        if (key in maxValues) {
            let inputValue = $(this).val().trim();
            
            if (inputValue !== "" && (parseInt(inputValue) > maxValues[key] || parseInt(inputValue) < minValue)) {
                $(this).val(Math.min(maxValues[key], Math.max(minValue, parseInt(inputValue)))); // Ensure value is within range
                showCustomAlert(`${key.charAt(0).toUpperCase() + key.slice(1)} should be between ${minValue} and ${maxValues[key]}!`);
            }
        }
    });
    

    

    $(document).on("input", ".default-value", function () {
        const defaultValue = $(this).val()?.toString().trim(); // Ensure it's treated as a string
        const dataType = $("#dataType").val(); // Get data type dynamically
        let errorMessage = "";
    
        if (dataType === "decimal") {
            const precision = parseInt($("[data-key='precision']").val()) || 10;
            const scale = parseInt($("[data-key='scale']").val()) || 2;
    
            // Ensure valid number format
            const numericValue = parseFloat(defaultValue);
            if (isNaN(numericValue) || !checkDecimalDefaultValue(numericValue.toString(), precision, scale)) {
                $(this).addClass("is-invalid");
                errorMessage = `Invalid Decimal: Maximum precision is ${precision}, and scale is ${scale}!`;
            } else {
                $(this).removeClass("is-invalid");
            }
        } else if (dataType === "integer") {
            if (!/^-?\d+$/.test(defaultValue)) { // Check if it's a valid integer
                $(this).addClass("is-invalid");
                errorMessage = `Invalid Integer: Only whole numbers are allowed!`;
                
            } else {
                $(this).removeClass("is-invalid");
            }

            if(defaultValue.toString().length > 5){
                $(this).addClass("is-invalid");
                errorMessage = `Integer default value cannot exceed 5 digits!`;
                showCustomAlert(errorMessage);
            }
        } else if (dataType === "string") {
            const maxLength = parseInt($("[data-key='length']").val()) || 255;
            if (defaultValue.length > maxLength) {
                $(this).addClass("is-invalid");
                errorMessage = `Invalid String: Maximum length allowed is ${maxLength} characters!`;
            } else {
                $(this).removeClass("is-invalid");
            }
        }else {
            $(this).removeClass("is-invalid"); // Reset for other types
        }
    
        // Show alert if there is an error
        if (errorMessage !== "") {
            showCustomAlert(errorMessage);
        }
    
        // ✅ Ensure Nullable Checkbox is Disabled for Integer & Other Data Types
        const nullableCheckbox = $(".nullable-checkbox");
        if (defaultValue !== "" && defaultValue !== null) {
            nullableCheckbox.prop("disabled", true).prop("checked", false);
        } else {
            nullableCheckbox.prop("disabled", false);
        }
    });
    
    
  
    // Handle the column name input changes
    $("#columnName").on("input", function () {
        if (selectedColumnIndex !== null) {
            columns[selectedColumnIndex].name = $(this).val();
            updateSidebar();
        }
    });
  
    // Handle data type selection
    $("#dataType").change(function () {
        if (selectedColumnIndex !== null) {
            saveColumnData();
            columns[selectedColumnIndex].type = $(this).val();
            showAdditionalFields($(this).val(), columns[selectedColumnIndex]);
        }
    });
  
    // Dynamically save input values for additional fields
    $(document).on("input", ".additional-input", function () {
        if (selectedColumnIndex !== null) {
            const key = $(this).data("key");
            let value = $(this).is(":checkbox") ? $(this).prop("checked") : $(this).val();
  
            columns[selectedColumnIndex][key] = value; // Store input changes dynamically
  
            // If options field is modified, update the Default Value dropdown
            if (key === "options") {
                updateDefaultValueDropdown(value);
            }
        }
    });
  
    // Remove the selected column
    $(document).on("click", "#columnsList .remove-btn-column", function (event) {
        event.stopPropagation();
        const columnIndex = $(this).closest(".list-group-item-column").data("index");
    
        if (columnIndex !== undefined) {
            columns.splice(columnIndex, 1);
            selectedColumnIndex = columns.length > 0 ? 0 : null;
            updateSidebar(); // Update the sidebar after removing an item
            columns.length > 0 ? loadColumnDetails() : $("#columnDetail").hide();
    
            showToast("Column removed successfully!");
        }
    });
    
    
    $(document).ready(function () {
        $('input[name="multiple_img"]').on('change', function () {
            if ($(this).val() === 'yes') {
                let columns = window.columns || []; // Ensure 'columns' is defined
                
                //console.log(columns);
    
                if (columns.length >= 2) {
                    showCustomAlert("As 'Multiple Image' is selected, another model will be created to handle images!");
                }
            }
        });
    });
    


  
    // Initially hide the column detail panel
    $("#columnDetail").hide();
    disableActions();  // Disable actions until the table name is set
    updateSidebar(); // Initial sidebar update
  
});