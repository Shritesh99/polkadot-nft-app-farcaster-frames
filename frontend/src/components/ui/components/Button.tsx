import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
	isLoading?: boolean;
	variant?: "primary" | "secondary" | "danger";
	size?: "sm" | "md" | "lg";
}

export function Button({
	children,
	className = "",
	isLoading = false,
	variant = "primary",
	size = "md",
	disabled,
	...props
}: ButtonProps) {
	const baseStyles =
		"inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

	const variantStyles = {
		primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
		secondary:
			"bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
		danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
	};

	const sizeStyles = {
		sm: "px-3 py-1.5 text-sm",
		md: "px-4 py-2 text-base",
		lg: "px-6 py-3 text-lg",
	};

	return (
		<button
			className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
			disabled={disabled || isLoading}
			{...props}>
			{isLoading ? (
				<div className="flex items-center">
					<div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
					<span>Loading...</span>
				</div>
			) : (
				children
			)}
		</button>
	);
}
