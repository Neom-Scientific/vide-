const { createSlice } = require("@reduxjs/toolkit");

const initialState = {
  isAuthenticated: false,
  user: null,
  error: null,
  success: null
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        loginSuccess: (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
        state.success = "Login successful!";
        },
        loginFailure: (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload;
        state.success = null;
        },
        logout: (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
        state.success = "Logout successful!";
        }
    }
})

const { loginSuccess, loginFailure, logout } = authSlice.actions;
export default authSlice.reducer;