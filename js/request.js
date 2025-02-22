document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('crudForm');
    const progressWrapper = document.getElementById('progressWrapper');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    //const generatedJsonPre = document.getElementById('generatedArray');
    const modal = document.getElementById('responseModal');
    const modalBody = document.getElementById('modalBody');
    const modalCloseButton = document.getElementById('modalCloseButton');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
    
        // Show the progress bar and reset its width
        progressWrapper.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = 'Processing...';
    
        let progress = 0;
        const progressPercent = document.getElementById('progressPercent');  // Get the span to show percentage
    
        // Start the interval to update the progress bar
        const interval = setInterval(() => {
            progress += 20; // Increase progress by 10% at each interval
            progressBar.style.width = `${progress}%`;
            progressPercent.textContent = `${progress}%`;  // Update the percentage text
    
            if (progress >= 90) {
                clearInterval(interval);  // Stop incrementing once the progress reaches 90%
            }
        }, 400);  // Update every 400ms (you can adjust this timing as needed)
    
        const formData = new FormData(form);
        const modelName = sanitizeInput(formData.get('modelName'));
        let columns = {};
        let relationships = [];
    
        try {
            const columnElements = document.querySelectorAll("#columnsDiv .form-group");

            columnElements.forEach((group, index) => {
              const columnName = trimSpace(group.querySelector('input[name="columns[][name]"]').value);
              const columnType = trimSpace(group.querySelector('select[name="columns[][type]"]').value);
              const nullableCheckbox = group.querySelector('input[name="columns[][nullable]"]');
              const nullable = nullableCheckbox && nullableCheckbox.checked ? "|nullable" : "";
        
              columns[sanitizeInput(columnName)] = `${sanitizeInput(columnType)}${nullable}`;
            });

            // Process relationships
            formData.getAll('relationships[][type]').forEach((type, index) => {
                const withValue = formData.getAll('relationships[][with]')[index];
                if (type && withValue) { // Add only valid relationships
                    relationships.push({
                        type: trimSpace(sanitizeInput(type)),
                        with: trimSpace(sanitizeInput(withValue)),
                    });
                }
            });

            // Generate the output string
            const output = `{
                "${sanitizeInput(modelName)}": {
                    "columns": { 
                        ${Object.entries(columns).map(([column, dataType]) => `"${column}": "${dataType}"`).join(',\n            ')}
                    }
                    ${relationships.length ? `,
                    "relationships": [
                        ${relationships.map(rel => `{"type": "${rel.type}", "with": "${rel.with}"}`).join(',\n            ')}
                    ]` : ''}
                }
            }`;


           console.log(output);
    
            // Fetch CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]').getAttribute('content');
            const uniqueId = Math.random().toString(36).substring(2, 9);            
            // Make the POST request with the output as a string
            fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({ body: output, uniqueId: uniqueId }), // Wrap output in a body key
            })
                .then(async (response) => {
                    const text = await response.text(); // Read response as text
                    try {
                        const data = JSON.parse(text); // Attempt to parse as JSON
            
                        if (response.ok && data.success) {
                            // Handle success response
                            progressBar.style.width = '100%'; // Set progress bar to 100%
                            progressPercent.textContent = '100%'; // Update percentage text to 100%
                            progressWrapper.style.display = 'none'; // Hide progress bar after completion
                            window.location.href = '/list';
                        } else {
                            // Handle error response from server
                            throw new Error(data.error || 'Unknown error occurred.');
                        }
                    } catch (error) {
                        // Handle parsing errors or server error response
                        progressWrapper.style.display = 'none';
                        toastr.error(error.message || 'Invalid response format.', 'Error');
                    }
                })
                .catch((error) => {
                    // Catch network errors or other unexpected issues
                    progressWrapper.style.display = 'none';
                    toastr.error(error.message || 'An unexpected error occurred. Please try again.', 'Error');
                });
            
        } catch (error) {
            progressWrapper.style.display = 'none';
            toastr.error('An error occurred while processing the form.', 'Error');
           
        }
    });
    
    function trimSpace(value) {
        return typeof value === "string" ? value.trim() : value;
    }

    // Show modal with data
    function showModal(data) {
        const modal = document.getElementById('responseModal');
        const modalBody = document.getElementById('modalBody');
        const modalCloseButton = document.getElementById('modalCloseButton');

        // Populate the modal with the response data
        modalBody.textContent = JSON.stringify(data, null, 2); // Update content to formatted JSON response

        // Display the modal
        modal.style.display = 'block';

        // Close modal when the close button is clicked
        modalCloseButton.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        // Optionally close the modal when clicking outside of it
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
});
