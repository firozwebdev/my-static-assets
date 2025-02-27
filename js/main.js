$(document).ready(function () {
    $('#generateBtn').click(function () {
        // Check table name if it is empty
        if (!isValidTableName($("#tableName").val().trim())) return;
        tableName = $("#tableName").val().trim();
        const multiple_img = $('input[name="multiple_img"]:checked').val();
       
        columns = window.columns;
        relationships = window.relationships;

        if (!tableName) {
            showCustomAlert("Please set the Model name first in the sidebar!");
            return;
        }

        // Check column count if it is less than 2, then show the error message
        if (columns.length < 2) {
            showCustomAlert("At least two columns are required to generate code!");
            return;
        }

        // Checking default value's consistency
        if (columns.length > 0) {
            if (!isDefaultValueConsistentOrNotInColumn(columns)) {
                return;
            }
            if (!isValidInput(columns)) {
                return;
            }
            if(hasDuplicateNames(columns)){
                showCustomAlert("Column name must be unique!");
                return;
            }
        }
        
        if(relationships.length > 0){
            let firstRelationship = relationships[0];
            let relatedModel = firstRelationship?.relatedModel || "";
            let type = firstRelationship?.type || "";
            if (relatedModel.trim() === "" || type.trim() === "") {
                showCustomAlert("Please complete relationship details first!");
                return;
            }
            if (!validateRelatedModels(relationships)) {
                return;
            }
        }

        // if (relationships.length > 0) {
        //     if (!validateRelatedModels(relationships)) {
        //         return;
        //     }
        // }

        // Reverse the columns order before processing
        const output = `{
            "${sanitizeInput(tableName)}": {
                "columns": { 
                    ${(() => {
                        // Clone columns to avoid modifying the original object
                        const updatedColumns = { ...columns };

                        // Ensure 'id' exists in columns
                        if (!Object.values(updatedColumns).some(col => col.name === 'id')) {
                            updatedColumns.id = { name: 'id', type: 'bigIncrements' }; // Default to bigIncrements
                        }

                        return Object.entries(updatedColumns).reverse().map(([columnIndex, columnData]) => {
                            if (!columnData || !columnData.name?.trim() || !columnData.type?.trim()) return '';  

                            let columnDefinition = `"${columnData.name}": `;

                            // Handle enum and options
                            if (columnData.type.startsWith('enum') || columnData.type.startsWith('options')) {
                                const formattedOptions = columnData.options 
                                    ? `,[${mapValuesForEnumAndOptions(columnData.options).join(',')}]` 
                                    : ',[Option1,Option2]';
                                columnDefinition += `"${columnData.type}${formattedOptions}`; 
                            } else {
                                if (columnData.type === 'decimal') {
                                    columnDefinition += `"${columnData.type}${columnData.precision ? `,${columnData.precision}` : ''}${columnData.scale ? `,${columnData.scale}` : ''}`;
                                } else {
                                    columnDefinition += `"${columnData.type}${columnData.length ? `,${columnData.length}` : ''}`; 
                                }
                            }

                            columnDefinition += `${columnData.nullable ? '|nullable' : ''}`;
                            columnDefinition += columnData.default ? `|default:${columnData.default}` : '';
                            columnDefinition += columnData.unique ? '|unique' : '';
                            columnDefinition += `"`;

                            return columnDefinition;
                        }).join(',\n            ');
                    })()}
                }

                ${multiple_img === 'yes' ? `,
                "Image": {
                    "columns": {
                        ${(() => {
                            let idType = 'bigIncrements'; // Default
                            if (columns?.id?.type) {
                                idType = columns.id.type; // Use actual type
                            } else {
                                // Find the first key that looks like an ID field
                                const possibleIdField = Object.values(columns).find(col => col.name === 'id' && col.type);
                                if (possibleIdField) {
                                    idType = possibleIdField.type;
                                }
                            }
                            return [
                                `"id": "${idType}"`, 
                                `"${sanitizeInput(tableName).toLowerCase()}_id": "foreignId"`,
                                `"${sanitizeInput(tableName).toLowerCase()}_image": "image"`
                            ].join(',\n            ');
                        })()}
                    }
                }` : ''}
        
                ${relationships.some(rel => rel.relatedModel?.trim() && rel.type?.trim()) ? `,
                "relationships": [
                    ${relationships.map(rel => {
                        if (!rel.relatedModel?.trim() || !rel.type?.trim()) return ''; 
                        return `{"type": "${rel.type}", "with": "${rel.relatedModel}"}`;
                    }).filter(Boolean).join(',\n        ')}
        
                ]` : ''}                
            }
        }`;
        
        

        //console.log(output);
        // Start the progress bar
        startProgress();
        // Fetch CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
        const uniqueId = Math.random().toString(36).substring(2, 9);            

        
        fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken, // Ensure this is the correct token
            },
            body: JSON.stringify({ body: output, uniqueId: uniqueId }),
        }).then(async (response) => {
            const text = await response.text(); // Read response as text
            try {
                const data = JSON.parse(text); // Attempt to parse as JSON
                
    
                if (response.ok && data.success) {
                    // Handle success response
                    setProgressBar(100, "Process Complete!");
                    
                    window.location.href = '/list';
                } else {
                    if (response.status === 429) {
                        // Handle "Too Many Requests" error separately
                        throw new Error('Server is busy, please try again later.');
                    } else {
                        // Handle other errors
                        throw new Error(data.error || data.message || 'Unknown error occurred.');
                    }
                }
            } catch (error) {
                // Handle parsing errors or server error response
                stopProgress();
                toastr.error(error.message || 'Invalid response format.', 'Error');
                showCustomAlert(error.message || 'Invalid response format.', 'Error');
                setProgressBar(0, "Error occurred!");
            }
        }).catch((error) => {
            // Catch network errors or other unexpected issues
            stopProgress();
            //toastr.error(error.message || 'An unexpected error occurred. Please try again.', 'Error');
            showCustomAlert(error.message || 'An unexpected error occurred. Please try again.', 'Error');
            setProgressBar(0, "Error occurred!");
        });
    });
});
