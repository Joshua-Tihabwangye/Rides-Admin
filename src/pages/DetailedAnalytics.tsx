import React, { useState, useMemo, useEffect } from "react";
import {
	Box,
	Card,
	CardContent,
	Typography,
	Button,
	Divider,
	Table,
	TableHead,
	TableBody,
	TableRow,
	TableCell,
	TableContainer,
	Paper,
	TextField,
	InputAdornment,
	IconButton,
	CircularProgress,
	Alert,
	Tabs,
	Tab,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import SearchIcon from "@mui/icons-material/Search";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
} from "recharts";
import { useNavigate } from "react-router-dom";
import PeriodSelector, { type PeriodOption } from "../components/PeriodSelector";
import type { Dayjs } from "dayjs";
import ExportButton from "../components/ExportButton";
import {
	getAdminAnalyticsTimeseries,
	getAdminAnalyticsDrivers,
	getAdminAnalyticsCompanies,
	type AdminAnalyticsTimeseriesPoint,
	type AdminAnalyticsDriverPoint,
	type AdminAnalyticsCompanyPoint,
} from "../services/api/adminApi";

// B3 – Detailed Analytics & Reports
// Route: /admin/reports

const EV_COLORS = {
	primary: "#03cd8c",
	secondary: "#f77f00",
};

function isoRange(range: [Dayjs | null, Dayjs | null]) {
	const [start, end] = range;
	return {
		start: start ? start.startOf("day").toISOString() : undefined,
		end: end ? end.endOf("day").toISOString() : undefined,
	};
}

const REPORTS = [
	{
		id: "TRIPS-VOLUME",
		name: "Trips & volumes",
		description: "Trip counts, distances and durations by region.",
		group: "Operations",
	},
	{
		id: "DRIVER-PERF",
		name: "Driver performance",
		description: "Acceptance, cancellations and ratings by driver.",
		group: "Drivers",
	},
	{
		id: "COMPANY-PERF",
		name: "Company performance",
		description: "Trips, cancellations and payouts by company.",
		group: "Companies",
	},
];

export default function DetailedAnalyticsPage() {
	const navigate = useNavigate();
	const [selectedReportId, setSelectedReportId] = useState(REPORTS[0].id);
	const [period, setPeriod] = useState<PeriodOption>("thisMonth");
	const [customRange, setCustomRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
	const [filters, setFilters] = useState({
		region: "",
		service: "",
	});
	const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
	const [searchQuery, setSearchQuery] = useState("");
	const [favorites, setFavorites] = useState<string[]>([]);
	const [recentReports, setRecentReports] = useState<string[]>([]);
	const [realSeries, setRealSeries] = useState<AdminAnalyticsTimeseriesPoint[]>([]);
	const [realDrivers, setRealDrivers] = useState<AdminAnalyticsDriverPoint[]>([]);
	const [realCompanies, setRealCompanies] = useState<AdminAnalyticsCompanyPoint[]>([]);
	const [analyticsLoading, setAnalyticsLoading] = useState(false);
	const [analyticsError, setAnalyticsError] = useState<string | null>(null);
	const [reportTab, setReportTab] = useState<"favorites" | "recent" | "all">(
		"all",
	);

	// Analytics are derived from backend database aggregates, not fabricated
	// client-side. Fetch the selected period and feed each report from the API.
	useEffect(() => {
		let active = true;
		const service = filters.service.trim();
		const region = filters.region.trim();
		const backendFilters = {
			service: service || undefined,
			region: region || undefined,
			...(period === "custom" ? isoRange(customRange) : {}),
		};
		setAnalyticsLoading(true);
		setAnalyticsError(null);
		const optional = <T,>(label: string, task: Promise<T>) => task.catch((error) => ({
			failed: `${label}: ${error instanceof Error ? error.message : "unavailable"}`,
		}));
		Promise.all([
			optional("Trip volume", getAdminAnalyticsTimeseries(period, backendFilters)),
			optional("Driver performance", getAdminAnalyticsDrivers(period, backendFilters)),
			optional("Company performance", getAdminAnalyticsCompanies(period, backendFilters)),
		])
			.then(([series, drivers, companies]) => {
				if (!active) return;
				const failures = [series, drivers, companies].flatMap((value) =>
					value && typeof value === "object" && "failed" in value ? [value.failed] : [],
				);
				if (failures.length) setAnalyticsError(failures.join("; "));
				if (Array.isArray(series)) setRealSeries(series);
				if (Array.isArray(drivers)) setRealDrivers(drivers);
				if (Array.isArray(companies)) setRealCompanies(companies);
			})
			.finally(() => {
				if (active) setAnalyticsLoading(false);
			});
		return () => {
			active = false;
		};
	}, [period, filters.region, filters.service, customRange]);

	const handlePeriodChange = (nextPeriod: PeriodOption, range?: { start: Dayjs; end: Dayjs }) => {
		setPeriod(nextPeriod);
		if (range) setCustomRange([range.start, range.end]);
	};

	const selectedReport =
		REPORTS.find((r) => r.id === selectedReportId) || REPORTS[0];

	const handleReportClick = (report: (typeof REPORTS)[number]) => {
		setSelectedReportId(report.id);
		// Add to recent if not already there
		if (!recentReports.includes(report.id)) {
			setRecentReports([report.id, ...recentReports.slice(0, 4)]);
		} else {
			// Move to front if already in recent
			setRecentReports([
				report.id,
				...recentReports.filter((id) => id !== report.id),
			]);
		}
	};

	const toggleFavorite = (reportId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (favorites.includes(reportId)) {
			setFavorites(favorites.filter((id) => id !== reportId));
		} else {
			setFavorites([...favorites, reportId]);
		}
	};

	const filteredReports = REPORTS.filter((report) => {
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			return (
				report.name.toLowerCase().includes(query) ||
				report.description.toLowerCase().includes(query) ||
				report.group.toLowerCase().includes(query)
			);
		}
		return true;
	});

	const getReportsByTab = () => {
		if (reportTab === "favorites") {
			return filteredReports.filter((r) => favorites.includes(r.id));
		} else if (reportTab === "recent") {
			return filteredReports.filter((r) => recentReports.includes(r.id));
		}
		return filteredReports;
	};

	const reportsByGroup = getReportsByTab().reduce(
		(acc, report) => {
			if (!acc[report.group]) acc[report.group] = [];
			acc[report.group].push(report);
			return acc;
		},
		{} as Record<string, typeof REPORTS>,
	);

	// Real backend-derived series for the Trips & volumes report.
	const realTripsData = realSeries.map((bucket) => ({
		name: bucket.date,
		transactions: bucket.transactions,
		revenue: bucket.revenue,
	}));

	// Real driver-performance rows (acceptance %, cancellations, rating).
	const realDriverData = realDrivers.map((d) => ({
		name: d.name,
		acceptance: d.acceptance,
		cancellations: d.cancelled,
		rating: d.rating,
		trips: d.trips,
	}));

	// Real company-performance rows (trips, cancellations, payouts/revenue).
	const realCompanyData = realCompanies.map((c) => ({
		name: c.name,
		trips: c.trips,
		cancellations: c.cancelled,
		payouts: c.payouts,
	}));

	// Only render real backend data. No fabricated fallback charts.
	const selectedReportData =
		selectedReportId === "TRIPS-VOLUME"
			? realTripsData
			: selectedReportId === "DRIVER-PERF"
			  ? realDriverData
			  : selectedReportId === "COMPANY-PERF"
			    ? realCompanyData
			    : [];

	const chartData = selectedReportData.map((row) => {
		if (selectedReportId === "TRIPS-VOLUME") {
			return {
				...row,
				transactions: row.transactions,
				revenue: row.revenue,
			};
		}

		if (selectedReportId === "DRIVER-PERF") {
			return {
				...row,
				acceptance: row.acceptance,
				cancellations: row.cancellations,
				rating: row.rating,
			};
		}

		if (selectedReportId === "COMPANY-PERF") {
			return {
				...row,
				trips: row.trips,
				cancellations: row.cancellations,
				payouts: row.payouts,
			};
		}

		return row;
	});

	const tableRows = chartData.map((row, index) => {
		if (selectedReportId === "TRIPS-VOLUME") {
			return {
				id: index + 1,
				period: row.name,
				service: filters.service === "All" ? "All" : filters.service,
				transactions: row.transactions,
				revenue: row.revenue,
			};
		}

		if (selectedReportId === "DRIVER-PERF") {
			return {
				id: index + 1,
				driver: row.name,
				acceptance: `${row.acceptance}%`,
				cancellations: row.cancellations,
				rating: row.rating.toFixed(1),
			};
		}

		return {
			id: index + 1,
			company: row.name,
			trips: row.trips,
			cancellations: row.cancellations,
			payouts: `$${row.payouts.toLocaleString()}`,
		};
	});

	// Calculate KPI summary for selected report
	const safeNum = (value: unknown): number => {
		const n = typeof value === "number" ? value : parseFloat(String(value));
		return Number.isFinite(n) ? n : 0;
	};
	const kpiSummary = useMemo(() => {
		if (selectedReportId !== "TRIPS-VOLUME") return null;
		const totalTransactions = tableRows.reduce((sum, row) => sum + safeNum(row.transactions), 0);
		const totalRevenue = tableRows.reduce((sum, row) => sum + safeNum(row.revenue), 0);

		return {
			totalTransactions,
			totalRevenue,
			averageRevenue: totalTransactions ? totalRevenue / totalTransactions : 0,
		};
	}, [tableRows, selectedReportId]);

	const handleExportCsv = () => {
		if (!tableRows.length) return;

		const header =
			selectedReportId === "TRIPS-VOLUME"
				? [
						"#",
						"Period",
						"Trips",
						"Revenue",
					]
				: selectedReportId === "DRIVER-PERF"
					? ["#", "Driver", "Acceptance %", "Cancellations", "Rating"]
					: ["#", "Company", "Trips", "Cancellations", "Payouts"];

		const csvLines = [
			header.join(","),
			...tableRows.map((row) => {
				if (selectedReportId === "TRIPS-VOLUME") {
					return [
						row.id,
						row.period,
						row.transactions,
						row.revenue,
					].join(",");
				}

				if (selectedReportId === "DRIVER-PERF") {
					return [
						row.id,
						row.driver,
						row.acceptance,
						row.cancellations,
						row.rating,
					].join(",");
				}

				return [
					row.id,
					row.company,
					row.trips,
					row.cancellations,
					row.payouts,
				].join(",");
			}),
		];

		const blob = new Blob([csvLines.join("\n")], {
			type: "text/csv;charset=utf-8;",
		});
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.setAttribute(
			"download",
			`evzone-report-${selectedReportId}-${period}.csv`,
		);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<Box>
			{/* Title */}
			<Box className="pb-4 flex items-center justify-between gap-2 flex-wrap">
				<Box>
					<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
						<Button onClick={() => navigate(-1)} startIcon={<ArrowBackIcon />} size="small" sx={{ textTransform: 'none' }}>
							Back
						</Button>
					</Box>
					<Typography
						variant="h6"
						className="font-semibold tracking-tight"
						color="text.primary"
					>
						Detailed Analytics
					</Typography>
					<Typography variant="caption" color="text.secondary">
						Deep dive into operational metrics, financial
						performance, and user growth.
					</Typography>
				</Box>
				<Box
					sx={{
						display: "flex",
						gap: 1,
						flexWrap: "wrap",
						alignItems: "center",
					}}
				>
					<TextField
						size="small"
						value={filters.region}
						onChange={(event) => setFilters((current) => ({ ...current, region: event.target.value }))}
						placeholder="Region"
						sx={{
							width: { xs: "100%", sm: 140 },
							"& .MuiOutlinedInput-root": {
								fontSize: 12,
								borderRadius: 2,
								height: 40,
								bgcolor: "background.paper",
							},
						}}
					/>
					<TextField
						size="small"
						value={filters.service}
						onChange={(event) => setFilters((current) => ({ ...current, service: event.target.value }))}
						placeholder="Service"
						sx={{
							width: { xs: "100%", sm: 140 },
							"& .MuiOutlinedInput-root": {
								fontSize: 12,
								borderRadius: 2,
								height: 40,
								bgcolor: "background.paper",
							},
						}}
					/>
					<PeriodSelector
						value={period}
						onChange={handlePeriodChange}
						customStart={customRange[0]}
						customEnd={customRange[1]}
					/>
					<ExportButton
						onDownload={handleExportCsv}
						onViewChart={() => setViewMode("chart")}
						onViewRawData={() => setViewMode("table")}
						variant="contained"
						label="Actions"
					/>
				</Box>
			</Box>

			{analyticsError ? <Alert severity="warning" sx={{ mb: 2, fontSize: 12 }}>{analyticsError}. Showing the last successful results where available.</Alert> : null}

			{/* Helper text */}
			<Alert severity="info" sx={{ mb: 2, fontSize: 12 }}>
				Pick a report on the left then filter and export on the right.
			</Alert>

			{/* Main Content */}
			<Box className="flex flex-col lg:flex-row gap-4">
				{/* Left – report list */}
				<Card
					elevation={2}
					sx={{
						flex: 1,
						borderRadius: 2,
						border: "1px solid rgba(148,163,184,0.3)",
						bgcolor: "background.paper",
					}}
				>
					<CardContent className="p-4 flex flex-col gap-3">
						<Typography
							variant="subtitle2"
							className="font-semibold"
							color="text.primary"
						>
							Report picker
						</Typography>
						<TextField
							size="small"
							placeholder="Search reports..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon fontSize="small" />
									</InputAdornment>
								),
							}}
							sx={{ mb: 1 }}
						/>
						<Tabs
							value={reportTab}
							onChange={(e, newValue) => setReportTab(newValue)}
							sx={{ minHeight: 32, mb: 1 }}
						>
							<Tab
								label="Favorites"
								value="favorites"
								sx={{ fontSize: 11, minHeight: 32 }}
							/>
							<Tab
								label="Recent"
								value="recent"
								sx={{ fontSize: 11, minHeight: 32 }}
							/>
							<Tab
								label="All"
								value="all"
								sx={{ fontSize: 11, minHeight: 32 }}
							/>
						</Tabs>
						<Divider className="!my-1" />
						<Box sx={{ maxHeight: 500, overflowY: "auto" }}>
							{reportTab === "favorites" &&
								favorites.length === 0 && (
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{ p: 2, display: "block" }}
									>
										No favorites yet. Click the star icon to
										add reports to favorites.
									</Typography>
								)}
							{Object.entries(reportsByGroup).map(
								([group, reports]) => (
									<Box key={group} sx={{ mb: 2 }}>
										<Typography
											variant="caption"
											sx={{
												display: "block",
												px: 1,
												mb: 1,
												fontSize: 10,
												fontWeight: 700,
												textTransform: "uppercase",
												color: "text.secondary",
											}}
										>
											{group}
										</Typography>
										{reports.map((report) => (
											<Box
												key={report.id}
												onClick={() =>
													handleReportClick(report)
												}
												sx={{
													cursor: "pointer",
													bgcolor:
														report.id ===
														selectedReportId
															? "rgba(3, 205, 140, 0.1)"
															: "transparent",
													display: "flex",
													alignItems: "center",
													px: 1,
													py: 1,
													borderRadius: 1,
													mb: 0.5,
													"&:hover": {
														bgcolor: "action.hover",
													},
												}}
											>
												<IconButton
													size="small"
													onClick={(e) =>
														toggleFavorite(
															report.id,
															e,
														)
													}
													sx={{ p: 0.5, mr: 1 }}
												>
													{favorites.includes(
														report.id,
													) ? (
														<StarIcon
															sx={{
																fontSize: 16,
																color: EV_COLORS.secondary,
															}}
														/>
													) : (
														<StarBorderIcon
															sx={{
																fontSize: 16,
															}}
														/>
													)}
												</IconButton>
												<Box sx={{ flex: 1 }}>
													<Typography
														variant="body2"
														sx={{
															fontWeight:
																report.id ===
																selectedReportId
																	? 600
																	: 400,
															fontSize: 12,
														}}
													>
														{report.name}
													</Typography>
													<Typography
														variant="caption"
														color="text.secondary"
														sx={{ fontSize: 10 }}
													>
														{report.description}
													</Typography>
												</Box>
											</Box>
										))}
									</Box>
								),
							)}
						</Box>
					</CardContent>
				</Card>

				{/* Right – filters & backend result */}
				<Card
					elevation={2}
					sx={{
						flex: 1.5,
						borderRadius: 2,
						border: "1px solid rgba(148,163,184,0.3)",
						bgcolor: "background.paper",
					}}
				>
					<CardContent className="p-4 flex flex-col gap-3">
							<Box className="flex items-center justify-between gap-2">
								<Box>
									<Typography
									variant="subtitle2"
									className="font-semibold"
									color="text.primary"
								>
									{selectedReport.name}
								</Typography>
								<Typography
									variant="caption"
									color="text.secondary"
								>
									{selectedReport.description}
								</Typography>
							</Box>
							<Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
								<Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>
									Report period
								</Typography>
								<PeriodSelector
									value={period}
									onChange={handlePeriodChange}
									customStart={customRange[0]}
									customEnd={customRange[1]}
								/>
							</Box>
						</Box>

						<Divider className="!my-1" />

						{/* KPI Summary Row */}
						{kpiSummary && selectedReportId === "TRIPS-VOLUME" && (
							<Box className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
								<Box
									sx={{
										p: 1.5,
										bgcolor: "background.default",
										borderRadius: 1,
									}}
								>
									<Typography
										variant="caption"
										className="text-[10px] text-slate-500"
									>
										Total trips
									</Typography>
									<Typography
										variant="h6"
										sx={{ fontSize: 16, fontWeight: 700 }}
									>
										{kpiSummary.totalTransactions.toLocaleString()}
									</Typography>
									<Typography
										variant="caption"
										className="text-[9px] text-slate-400"
									>
										Ride records
									</Typography>
								</Box>
								<Box
									sx={{
										p: 1.5,
										bgcolor: "background.default",
										borderRadius: 1,
									}}
								>
									<Typography
										variant="caption"
										className="text-[10px] text-slate-500"
									>
										Revenue
									</Typography>
									<Typography
										variant="h6"
										sx={{ fontSize: 16, fontWeight: 700 }}
									>
										UGX {kpiSummary.totalRevenue.toLocaleString()}
									</Typography>
									<Typography
										variant="caption"
										className="text-[9px] text-slate-400"
									>
										Fare total
									</Typography>
								</Box>
								<Box
									sx={{
										p: 1.5,
										bgcolor: "background.default",
										borderRadius: 1,
									}}
								>
									<Typography
										variant="caption"
										className="text-[10px] text-slate-500"
									>
										Avg revenue
									</Typography>
									<Typography
										variant="h6"
										sx={{ fontSize: 16, fontWeight: 700 }}
									>
										UGX {Math.round(kpiSummary.averageRevenue).toLocaleString()}
									</Typography>
									<Typography
										variant="caption"
										className="text-[9px] text-slate-400"
									>
										Per trip
									</Typography>
								</Box>
								<Box
									sx={{
										p: 1.5,
										bgcolor: "background.default",
										borderRadius: 1,
									}}
								>
									<Typography
										variant="caption"
										className="text-[10px] text-slate-500"
									>
										Buckets
									</Typography>
									<Typography
										variant="h6"
										sx={{ fontSize: 16, fontWeight: 700 }}
									>
										{tableRows.length}
									</Typography>
									<Typography
										variant="caption"
										className="text-[9px] text-slate-400"
									>
										Time-series rows
									</Typography>
								</Box>
							</Box>
						)}

						<Box className="flex items-center justify-between mt-1 mb-2">
							<Typography
								variant="caption"
								className="text-[11px]"
								color="text.secondary"
							>
								Displaying data for Period: <b>{period}</b>,
								Region: <b>{filters.region}</b>, Service:{" "}
								<b>{filters.service}</b>.
							</Typography>
							<Box className="flex gap-1">
								<Button
									size="small"
									variant={
										viewMode === "chart"
											? "contained"
											: "outlined"
									}
									onClick={() => setViewMode("chart")}
									sx={{ fontSize: 10, textTransform: "none" }}
								>
									Charts
								</Button>
								<Button
									size="small"
									variant={
										viewMode === "table"
											? "contained"
											: "outlined"
									}
									onClick={() => setViewMode("table")}
									sx={{ fontSize: 10, textTransform: "none" }}
								>
									Table
								</Button>
							</Box>
						</Box>

						{analyticsLoading && (
							<Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
								<CircularProgress size={24} />
							</Box>
						)}
						{!analyticsLoading && chartData.length === 0 && (
							<Card elevation={0} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.2)", bgcolor: "background.default", minHeight: 250 }}>
								<CardContent className="p-3">
									<Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 220 }}>
										<Alert severity="info" sx={{ maxWidth: 420 }}>
											No database records match this report and filter period yet.
										</Alert>
									</Box>
								</CardContent>
							</Card>
						)}

						{/* Backend results table/chart */}
						{!analyticsLoading && chartData.length > 0 && (
							<Card
								elevation={0}
								sx={{
									borderRadius: 2,
									border: "1px solid rgba(148,163,184,0.2)",
									bgcolor: "background.default",
									minHeight: 250,
								}}
							>
								<CardContent className="p-3">
									{viewMode === "chart" ? (
										<Box
											sx={{ width: "100%", height: 250 }}
										>
											<ResponsiveContainer
												width="100%"
												height="100%"
											>
												<BarChart data={chartData}>
													<CartesianGrid
														strokeDasharray="3 3"
														stroke="#334155"
													/>
													<XAxis
														dataKey="name"
														fontSize={11}
														stroke="#94a3b8"
													/>
													<YAxis
														fontSize={11}
														stroke="#94a3b8"
													/>
													<Tooltip
														contentStyle={{
															backgroundColor:
																"#0f172a",
															border: "1px solid #334155",
															borderRadius: 8,
															fontSize: 11,
														}}
														labelStyle={{
															color: "#e5e7eb",
														}}
														itemStyle={{
															color: "#03cd8c",
														}}
													/>
													<Legend
														wrapperStyle={{
															fontSize: 11,
														}}
													/>
													{selectedReportId ===
														"TRIPS-VOLUME" && (
														<>
															<Bar
																dataKey="transactions"
																fill="#03cd8c"
																	name="Trips"
																radius={[
																	4, 4, 0, 0,
																]}
															/>
															<Bar
																dataKey="revenue"
																fill="#f77f00"
																name="Revenue"
																radius={[
																	4, 4, 0, 0,
																]}
															/>
														</>
													)}
													{selectedReportId ===
														"DRIVER-PERF" && (
														<>
															<Bar
																dataKey="acceptance"
																fill="#03cd8c"
																name="Acceptance %"
																radius={[
																	4, 4, 0, 0,
																]}
															/>
															<Bar
																dataKey="cancellations"
																fill="#f77f00"
																name="Cancellations"
																radius={[
																	4, 4, 0, 0,
																]}
															/>
															<Bar
																dataKey="rating"
																fill="#2563eb"
																name="Rating"
																radius={[
																	4, 4, 0, 0,
																]}
															/>
														</>
													)}
													{selectedReportId ===
														"COMPANY-PERF" && (
														<>
															<Bar
																dataKey="trips"
																fill="#03cd8c"
																name="Trips"
																radius={[
																	4, 4, 0, 0,
																]}
															/>
															<Bar
																dataKey="cancellations"
																fill="#f77f00"
																name="Cancellations"
																radius={[
																	4, 4, 0, 0,
																]}
															/>
															<Bar
																dataKey="payouts"
																fill="#2563eb"
																name="Payouts"
																radius={[
																	4, 4, 0, 0,
																]}
															/>
														</>
													)}
												</BarChart>
											</ResponsiveContainer>
										</Box>
									) : (
										<TableContainer
											component={Paper}
											elevation={0}
											sx={{ maxHeight: 260 }}
										>
											<Table size="small" stickyHeader>
												<TableHead>
													<TableRow>
														<TableCell>
															{selectedReportId ===
															"DRIVER-PERF"
																? "Driver"
																: selectedReportId ===
																	  "COMPANY-PERF"
																	? "Company"
																	: "Period"}
														</TableCell>
														{selectedReportId ===
															"TRIPS-VOLUME" && (
															<TableCell>
																Service
															</TableCell>
														)}
														<TableCell align="right">
															{selectedReportId ===
															"DRIVER-PERF"
																? "Acceptance %"
																: selectedReportId ===
																	  "COMPANY-PERF"
																	? "Trips"
																	: "Trips"}
														</TableCell>
														<TableCell align="right">
															{selectedReportId ===
																"COMPANY-PERF" ||
															selectedReportId ===
																"DRIVER-PERF"
																? "Cancellations"
																: "Revenue"}
														</TableCell>
														{selectedReportId ===
														  "DRIVER-PERF" ? (
															<TableCell align="right">
																Rating
															</TableCell>
														) : (
															<TableCell align="right">
																Payouts
															</TableCell>
														)}
													</TableRow>
												</TableHead>
												<TableBody>
													{tableRows.map((row) => (
														<TableRow
															key={row.id}
															hover
														>
															<TableCell>
																{selectedReportId ===
																"DRIVER-PERF"
																	? row.driver
																	: selectedReportId ===
																		  "COMPANY-PERF"
																		? row.company
																		: row.period}
															</TableCell>
															{selectedReportId ===
																"TRIPS-VOLUME" && (
																<TableCell>
																	{
																		row.service
																	}
																</TableCell>
															)}
															<TableCell align="right">
																{selectedReportId ===
																"DRIVER-PERF"
																	? row.acceptance
																	: selectedReportId === "COMPANY-PERF"
																		? row.trips.toLocaleString()
																		: row.transactions.toLocaleString()}
															</TableCell>
															<TableCell align="right">
																{selectedReportId ===
																"TRIPS-VOLUME"
																	? `UGX ${row.revenue.toLocaleString()}`
																	: row.cancellations}
															</TableCell>
															{selectedReportId ===
															"DRIVER-PERF" ? (
																<TableCell align="right">
																	{row.rating}
																</TableCell>
															) : (
																<TableCell align="right">
																	{
																		row.payouts
																	}
																</TableCell>
															)}
														</TableRow>
													))}
												</TableBody>
											</Table>
										</TableContainer>
									)}
								</CardContent>
							</Card>
						)}
					</CardContent>
				</Card>
			</Box>
		</Box>
	);
}
