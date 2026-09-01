import React, { useState, useMemo, useEffect } from "react";
import {
	Box,
	Card,
	CardContent,
	Typography,
	Chip,
	Button,
	Divider,
	Select,
	MenuItem,
	Table,
	TableHead,
	TableBody,
	TableRow,
	TableCell,
	TableContainer,
	Paper,
	FormControl,
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
import DownloadIcon from "@mui/icons-material/Download";
import { useNavigate } from "react-router-dom";
import PeriodSelector, { type PeriodOption } from "../components/PeriodSelector";
import ExportButton from "../components/ExportButton";
import dayjs from "dayjs";
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

const REPORT_GROUPS = [
	"Operations",
	"Drivers",
	"Companies",
	"Finance",
	"Safety",
];

export default function DetailedAnalyticsPage() {
	const navigate = useNavigate();
	const [selectedReportId, setSelectedReportId] = useState(REPORTS[0].id);
	const [period, setPeriod] = useState<PeriodOption>("thisMonth");
	const [filters, setFilters] = useState({
		region: "All",
		service: "All",
	});
	const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
	const [searchQuery, setSearchQuery] = useState("");
	const [favorites, setFavorites] = useState<string[]>(["TRIPS-VOLUME"]);
	const [recentReports, setRecentReports] = useState<string[]>([
		"TRIPS-VOLUME",
	]);
	const [realSeries, setRealSeries] = useState<AdminAnalyticsTimeseriesPoint[]>([]);
	const [realDrivers, setRealDrivers] = useState<AdminAnalyticsDriverPoint[]>([]);
	const [realCompanies, setRealCompanies] = useState<AdminAnalyticsCompanyPoint[]>([]);
	const [analyticsLoading, setAnalyticsLoading] = useState(false);
	const [previewState, setPreviewState] = useState<
		"ready" | "loading" | "empty" | "error"
	>("ready");
	const [reportTab, setReportTab] = useState<"favorites" | "recent" | "all">(
		"all",
	);

	// Phase 12/13: analytics are derived from the backend (real database
	// aggregates), not fabricated client-side. Fetch the per-day revenue /
	// transaction time-series for the selected period and feed it into the
	// Trips & volumes report.
	useEffect(() => {
		let active = true;
		setAnalyticsLoading(true);
		Promise.all([
			getAdminAnalyticsTimeseries(period).catch(() => []),
			getAdminAnalyticsDrivers(period).catch(() => []),
			getAdminAnalyticsCompanies(period).catch(() => []),
		])
			.then(([series, drivers, companies]) => {
				if (!active) return;
				setRealSeries(Array.isArray(series) ? series : []);
				setRealDrivers(Array.isArray(drivers) ? drivers : []);
				setRealCompanies(Array.isArray(companies) ? companies : []);
			})
			.finally(() => {
				if (active) setAnalyticsLoading(false);
			});
		return () => {
			active = false;
		};
	}, [period]);

	const selectedReport =
		REPORTS.find((r) => r.id === selectedReportId) || REPORTS[0];

	const handleReportClick = (report) => {
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

	const handleFilterChange = (field) => (event) => {
		setFilters({ ...filters, [field]: event.target.value });
	};

	// Real backend-derived series for the Trips & volumes report: each payment
	// bucket becomes a row with the transaction count and revenue.
	const realTripsData = realSeries.map((bucket) => ({
		name: bucket.date,
		rides: bucket.transactions,
		revenue: bucket.revenue,
		distance: 0,
		duration: 0,
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
				rides: row.rides,
				distance: row.distance || 0,
				duration: row.duration || 0,
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
				region: row.name,
				service: filters.service === "All" ? "All" : filters.service,
				trips: row.rides,
				completionRate:
					row.completion != null ? `${row.completion}%` : "N/A",
				avgDistance:
					row.distance != null ? `${Number(row.distance).toFixed(1)}` : "N/A",
				avgDuration:
					row.duration != null ? `${Number(row.duration).toFixed(1)}` : "N/A",
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
		const totalTrips = tableRows.reduce((sum, row) => sum + row.trips, 0);
		const weightedCompletion =
			tableRows.reduce((sum, row) => sum + row.trips * safeNum(row.completionRate), 0) /
			(totalTrips || 1);
		const weightedDistance =
			tableRows.reduce((sum, row) => sum + row.trips * safeNum(row.avgDistance), 0) /
			(totalTrips || 1);
		const weightedDuration =
			tableRows.reduce((sum, row) => sum + row.trips * safeNum(row.avgDuration), 0) /
			(totalTrips || 1);

		return {
			totalTrips,
			completionRate: weightedCompletion.toFixed(1),
			avgDistance: weightedDistance.toFixed(1),
			avgDuration: weightedDuration.toFixed(1),
		};
	}, [tableRows, selectedReportId]);

	const handleExportCsv = () => {
		if (!tableRows.length) return;

		const header =
			selectedReportId === "TRIPS-VOLUME"
				? [
						"#",
						"Region",
						"Trips",
						"Completion rate",
						"Avg distance",
						"Avg duration",
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
						row.region,
						row.trips,
						row.completionRate,
						row.avgDistance,
						row.avgDuration,
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
					<FormControl size="small" sx={{ minWidth: 120 }}>
						<Select
							value={filters.region}
							onChange={handleFilterChange("region")}
							displayEmpty
							sx={{
								fontSize: 12,
								borderRadius: 2,
								height: 40,
								bgcolor: "background.paper",
							}}
						>
							<MenuItem value="All">All Regions</MenuItem>
							<MenuItem value="Kampala">Kampala</MenuItem>
							<MenuItem value="Nairobi">Nairobi</MenuItem>
							<MenuItem value="Lagos">Lagos</MenuItem>
						</Select>
					</FormControl>
					<FormControl size="small" sx={{ minWidth: 120 }}>
						<Select
							value={filters.service}
							onChange={handleFilterChange("service")}
							displayEmpty
							sx={{
								fontSize: 12,
								borderRadius: 2,
								height: 40,
								bgcolor: "background.paper",
							}}
						>
							<MenuItem value="All">All Services</MenuItem>
							<MenuItem value="Rides">Rides</MenuItem>
							<MenuItem value="Delivery">Delivery</MenuItem>
							<MenuItem value="Logistics">Logistics</MenuItem>
						</Select>
					</FormControl>
					<PeriodSelector
						value={period}
						onChange={(p) => setPeriod(p)}
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

				{/* Right – filters & sample result */}
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
										{kpiSummary.totalTrips.toLocaleString()}
									</Typography>
									<Typography
										variant="caption"
										className="text-[9px] text-slate-400"
									>
										Sum across selected filters
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
										Completion rate
									</Typography>
									<Typography
										variant="h6"
										sx={{ fontSize: 16, fontWeight: 700 }}
									>
										{kpiSummary.completionRate}%
									</Typography>
									<Typography
										variant="caption"
										className="text-[9px] text-slate-400"
									>
										Weighted by trips
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
										Avg distance
									</Typography>
									<Typography
										variant="h6"
										sx={{ fontSize: 16, fontWeight: 700 }}
									>
										{kpiSummary.avgDistance} km
									</Typography>
									<Typography
										variant="caption"
										className="text-[9px] text-slate-400"
									>
										Weighted by trips
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
										Avg duration
									</Typography>
									<Typography
										variant="h6"
										sx={{ fontSize: 16, fontWeight: 700 }}
									>
										{kpiSummary.avgDuration} min
									</Typography>
									<Typography
										variant="caption"
										className="text-[9px] text-slate-400"
									>
										Weighted by trips
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

						{/* Preview state indicator */}
						{previewState === "loading" && (
							<Box
								sx={{
									display: "flex",
									justifyContent: "center",
									p: 4,
								}}
							>
								<CircularProgress size={24} />
							</Box>
						)}
						{previewState === "error" && (
							<Alert severity="error" sx={{ mb: 2 }}>
								Error loading data. Please try again.
							</Alert>
						)}
						{previewState === "empty" && (
							<Alert severity="info" sx={{ mb: 2 }}>
								No data available for the selected filters.
							</Alert>
						)}
						{analyticsLoading && (
							<Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
								<CircularProgress size={24} />
							</Box>
						)}
						{!analyticsLoading && chartData.length === 0 && previewState === "ready" && (
							<Card elevation={0} sx={{ borderRadius: 2, border: "1px solid rgba(148,163,184,0.2)", bgcolor: "background.default", minHeight: 250 }}>
								<CardContent className="p-3">
									<Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 220 }}>
										<Alert severity="info" sx={{ maxWidth: 420 }}>
											No real backend data available for this report yet. Reports populate from database aggregates as activity is recorded.
										</Alert>
									</Box>
								</CardContent>
							</Card>
						)}

						{/* Sample results table/chart */}
						{previewState === "ready" && !analyticsLoading && chartData.length > 0 && (
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
																dataKey="rides"
																fill="#03cd8c"
																name="Trips"
																radius={[
																	4, 4, 0, 0,
																]}
															/>
															<Bar
																dataKey="completion"
																fill="#f77f00"
																name="Completion Rate %"
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
																	: "Region"}
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
																: "Completion %"}
														</TableCell>
														{selectedReportId ===
														"TRIPS-VOLUME" ? (
															<>
																<TableCell align="right">
																	Avg distance
																</TableCell>
																<TableCell align="right">
																	Avg duration
																</TableCell>
															</>
														) : selectedReportId ===
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
																		: row.region}
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
																	: row.trips.toLocaleString()}
															</TableCell>
															<TableCell align="right">
																{selectedReportId ===
																"TRIPS-VOLUME"
																	? row.completionRate
																	: row.cancellations}
															</TableCell>
															{selectedReportId ===
															"TRIPS-VOLUME" ? (
																<>
																	<TableCell align="right">
																		{
																			row.avgDistance
																		}{" "}
																		km
																	</TableCell>
																	<TableCell align="right">
																		{
																			row.avgDuration
																		}{" "}
																		min
																	</TableCell>
																</>
															) : selectedReportId ===
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
