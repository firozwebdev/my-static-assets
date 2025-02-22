window.tableName = "";
window.columns = [];
window.relationships = [];
// Function to show the custom modal with a dynamic message
function showCustomAlert(message) {
    $('#modalMessage').text(message);  // Set the dynamic message
    $('#customAlertModal').modal('show');  // Show the modal
}