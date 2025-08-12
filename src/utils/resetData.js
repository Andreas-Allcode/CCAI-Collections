export const resetMockData = () => {
  localStorage.removeItem('ccai_mock_data');
  window.location.reload();
};