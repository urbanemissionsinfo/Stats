import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';

const BayesianSequence = () => {
  const observations = [10, 20, 30];
  
  // Bayesian linear regression
  const performBayesianRegression = () => {
    const n = observations.length;
    const X = observations.map((_, i) => i + 1); // [1, 2, 3]
    const y = observations; // [10, 20, 30]
    
    // Prior parameters (non-informative)
    const mu0 = 0; // prior mean for slope
    const sigma0_sq = 1000; // prior variance for slope (large = uninformative)
    const alpha0 = 0.01; // prior shape for noise precision
    const beta0 = 0.01; // prior rate for noise precision
    
    // Calculate sufficient statistics
    const X_mean = X.reduce((a, b) => a + b, 0) / n;
    const y_mean = y.reduce((a, b) => a + b, 0) / n;
    
    const X_centered = X.map(x => x - X_mean);
    const y_centered = y.map(y_i => y_i - y_mean);
    
    const Sxx = X_centered.reduce((sum, x, i) => sum + x * x, 0);
    const Sxy = X_centered.reduce((sum, x, i) => sum + x * y_centered[i], 0);
    
    // Posterior for slope (assuming intercept near 0 for simplicity)
    const slope_mle = Sxy / Sxx;
    const intercept_mle = y_mean - slope_mle * X_mean;
    
    // Calculate residuals for noise estimation
    const residuals = y.map((y_i, i) => y_i - (intercept_mle + slope_mle * X[i]));
    const SSE = residuals.reduce((sum, r) => sum + r * r, 0);
    
    // Posterior parameters
    const sigma_n_sq = 1 / (1 / sigma0_sq + Sxx);
    const mu_n = sigma_n_sq * (mu0 / sigma0_sq + Sxy);
    
    const alpha_n = alpha0 + n / 2;
    const beta_n = beta0 + SSE / 2 + (slope_mle - mu0) ** 2 / (2 * (sigma0_sq + 1 / Sxx));
    
    // Prediction for 4th point
    const x_new = 4;
    const y_pred_mean = intercept_mle + slope_mle * x_new;
    
    // Posterior predictive variance
    const noise_var = beta_n / (alpha_n - 1); // Expected noise variance
    const param_var = sigma_n_sq * x_new * x_new; // Parameter uncertainty
    const pred_var = noise_var + param_var;
    const pred_std = Math.sqrt(pred_var);
    
    return {
      mean: y_pred_mean,
      std: pred_std,
      slope: slope_mle,
      intercept: intercept_mle,
      confidence_95: [y_pred_mean - 1.96 * pred_std, y_pred_mean + 1.96 * pred_std]
    };
  };
  
  const result = performBayesianRegression();
  
  // Generate visualization data
  const generateChartData = () => {
    const data = [];
    
    // Observed points
    observations.forEach((val, idx) => {
      data.push({
        x: idx + 1,
        observed: val,
        predicted: result.intercept + result.slope * (idx + 1)
      });
    });
    
    // Prediction for 4th point
    data.push({
      x: 4,
      predicted: result.mean,
      lower: result.confidence_95[0],
      upper: result.confidence_95[1]
    });
    
    return data;
  };
  
  const chartData = generateChartData();
  
  // Generate probability distribution for visualization
  const generatePDF = () => {
    const points = [];
    const mean = result.mean;
    const std = result.std;
    
    for (let x = mean - 3 * std; x <= mean + 3 * std; x += std / 20) {
      const y = (1 / (std * Math.sqrt(2 * Math.PI))) * 
                Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
      points.push({ value: x, density: y });
    }
    
    return points;
  };
  
  const pdfData = generatePDF();

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-indigo-900">Bayesian Sequence Prediction</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold mb-3 text-indigo-700">Observed Sequence</h3>
        <p className="text-lg mb-4">Data: <span className="font-mono font-bold text-blue-600">{observations.join(', ')}, ?</span></p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-l-4 border-green-500">
            <p className="text-sm text-gray-600 mb-1">Predicted 4th Value</p>
            <p className="text-3xl font-bold text-green-700">{result.mean.toFixed(2)}</p>
          </div>
          
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border-l-4 border-orange-500">
            <p className="text-sm text-gray-600 mb-1">Uncertainty (±1 std)</p>
            <p className="text-3xl font-bold text-orange-700">±{result.std.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="mt-4 bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">95% Credible Interval:</span> 
            <span className="font-mono ml-2 text-blue-700">
              [{result.confidence_95[0].toFixed(2)}, {result.confidence_95[1].toFixed(2)}]
            </span>
          </p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-xl font-semibold mb-4 text-indigo-700">Sequence Visualization</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="x" label={{ value: 'Draw Number', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Value', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="observed" stroke="#10b981" strokeWidth={3} name="Observed" dot={{ r: 6 }} />
            <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" name="Predicted" />
            <Line type="monotone" dataKey="lower" stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 3" name="95% CI Lower" />
            <Line type="monotone" dataKey="upper" stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 3" name="95% CI Upper" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-indigo-700">Posterior Predictive Distribution</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={pdfData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="value" label={{ value: 'Predicted Value', position: 'insideBottom', offset: -5 }} />
            <YAxis label={{ value: 'Probability Density', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Area type="monotone" dataKey="density" stroke="#6366f1" fill="#818cf8" fillOpacity={0.6} name="PDF" />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-sm text-gray-600 mt-2 text-center">
          This shows the probability distribution of the 4th draw given the observed data
        </p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h3 className="text-xl font-semibold mb-3 text-indigo-700">Model Parameters</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Estimated Slope</p>
            <p className="text-lg font-mono font-semibold text-indigo-600">{result.slope.toFixed(4)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Estimated Intercept</p>
            <p className="text-lg font-mono font-semibold text-indigo-600">{result.intercept.toFixed(4)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BayesianSequence;