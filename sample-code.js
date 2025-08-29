// Sample JavaScript function for testing
function calculateSum(a, b) {
    // This is a simple addition function
    return a + b;
}

// Another function with potential issues
function divide(x, y) {
    return x / y; // No zero division check!
}

module.exports = { calculateSum, divide };
