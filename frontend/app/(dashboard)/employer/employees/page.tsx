"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/shared/GlassCard";
import { Button } from "@/components/ui/button";
import {
  Users,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Clock,
  Wallet,
  TrendingUp,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  ChevronDown,
  Download,
  Upload,
  RefreshCw,
  UserPlus,
  Edit2,
  Trash2,
  Eye,
  Zap,
} from "lucide-react";

// Mock employee data
const employees = [
  {
    id: 1,
    name: "Priya Sharma",
    email: "priya.sharma@company.com",
    phone: "+91 98765 43210",
    role: "Senior Developer",
    department: "Engineering",
    location: "Mumbai",
    status: "streaming",
    streamRate: "0.0012 USDC/sec",
    totalEarned: "45,280 USDC",
    hoursToday: "6h 24m",
    joinDate: "2024-01-15",
    avatar: "PS",
  },
  {
    id: 2,
    name: "Arjun Patel",
    email: "arjun.patel@company.com",
    phone: "+91 87654 32109",
    role: "Product Designer",
    department: "Design",
    location: "Bangalore",
    status: "streaming",
    streamRate: "0.0010 USDC/sec",
    totalEarned: "38,450 USDC",
    hoursToday: "5h 48m",
    joinDate: "2024-02-20",
    avatar: "AP",
  },
  {
    id: 3,
    name: "Sneha Reddy",
    email: "sneha.reddy@company.com",
    phone: "+91 76543 21098",
    role: "Marketing Manager",
    department: "Marketing",
    location: "Hyderabad",
    status: "paused",
    streamRate: "0.0009 USDC/sec",
    totalEarned: "32,180 USDC",
    hoursToday: "4h 12m",
    joinDate: "2024-03-10",
    avatar: "SR",
  },
  {
    id: 4,
    name: "Rahul Kumar",
    email: "rahul.kumar@company.com",
    phone: "+91 65432 10987",
    role: "DevOps Engineer",
    department: "Engineering",
    location: "Delhi",
    status: "streaming",
    streamRate: "0.0011 USDC/sec",
    totalEarned: "41,890 USDC",
    hoursToday: "7h 02m",
    joinDate: "2024-01-25",
    avatar: "RK",
  },
  {
    id: 5,
    name: "Anita Singh",
    email: "anita.singh@company.com",
    phone: "+91 54321 09876",
    role: "HR Specialist",
    department: "Human Resources",
    location: "Chennai",
    status: "inactive",
    streamRate: "0.0008 USDC/sec",
    totalEarned: "28,540 USDC",
    hoursToday: "0h 00m",
    joinDate: "2024-04-05",
    avatar: "AS",
  },
];

const stats = [
  { label: "Total Employees", value: "24", icon: Users, color: "from-[#E85A4F] to-[#F4A259]" },
  { label: "Currently Streaming", value: "18", icon: Zap, color: "from-[#2D9F6C] to-[#34D399]" },
  { label: "Total Disbursed", value: "4.2M USDC", icon: Wallet, color: "from-[#6BB3D9] to-[#93C5FD]" },
  { label: "Avg. Hours/Day", value: "6.5h", icon: Clock, color: "from-[#F2B5D4] to-[#EC4899]" },
];

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || emp.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "streaming":
        return "bg-[#2D9F6C]/15 text-[#2D9F6C] border-[#2D9F6C]/30";
      case "paused":
        return "bg-[#F4A259]/15 text-[#E8A838] border-[#F4A259]/30";
      case "inactive":
        return "bg-[#718096]/15 text-[#718096] border-[#718096]/30";
      default:
        return "bg-[#718096]/15 text-[#718096] border-[#718096]/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "streaming":
        return <Play size={12} className="fill-current" />;
      case "paused":
        return <Pause size={12} />;
      case "inactive":
        return <XCircle size={12} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-[#1A1A2E]">
                Employee Management
              </h1>
              <p className="text-[#4A5568] mt-1">
                Manage your workforce and wage streams
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-[#E8DED4] text-[#4A5568] hover:bg-[#F5EDE6]">
                <Upload size={18} className="mr-2" />
                Import
              </Button>
              <Button variant="outline" className="border-[#E8DED4] text-[#4A5568] hover:bg-[#F5EDE6]">
                <Download size={18} className="mr-2" />
                Export
              </Button>
              <Button onClick={() => setShowAddModal(true)}>
                <UserPlus size={18} className="mr-2" />
                Add Employee
              </Button>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <GlassCard className="p-5" variant="default">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-[#4A5568]">{stat.label}</p>
                      <p className="text-2xl lg:text-3xl font-bold text-[#1A1A2E] mt-1">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                      <stat.icon size={24} className="text-white" />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <GlassCard className="p-4" variant="default">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#718096]" />
                  <input
                    type="text"
                    placeholder="Search employees by name, email, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#FAF6F1] border border-[#E8DED4] text-[#1A1A2E] placeholder:text-[#718096] focus:outline-none focus:border-[#E85A4F]/50 transition-colors"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                  {["all", "streaming", "paused", "inactive"].map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        filterStatus === status
                          ? "bg-[#E85A4F] text-white"
                          : "bg-[#FAF6F1] text-[#4A5568] hover:bg-[#F5EDE6] border border-[#E8DED4]"
                      }`}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                  ))}
                </div>

                <Button variant="outline" className="border-[#E8DED4] text-[#4A5568] hover:bg-[#F5EDE6]">
                  <RefreshCw size={18} />
                </Button>
              </div>
            </GlassCard>
          </motion.div>

          {/* Employee Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlassCard className="overflow-hidden" variant="default">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E8DED4]">
                      <th className="text-left p-4 text-sm font-semibold text-[#4A5568]">Employee</th>
                      <th className="text-left p-4 text-sm font-semibold text-[#4A5568]">Department</th>
                      <th className="text-left p-4 text-sm font-semibold text-[#4A5568]">Status</th>
                      <th className="text-left p-4 text-sm font-semibold text-[#4A5568]">Stream Rate</th>
                      <th className="text-left p-4 text-sm font-semibold text-[#4A5568]">Today</th>
                      <th className="text-left p-4 text-sm font-semibold text-[#4A5568]">Total Earned</th>
                      <th className="text-right p-4 text-sm font-semibold text-[#4A5568]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((employee, index) => (
                      <motion.tr
                        key={employee.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="border-b border-[#E8DED4]/50 hover:bg-[#FAF6F1]/50 transition-colors"
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E85A4F] to-[#F4A259] flex items-center justify-center text-white font-semibold text-sm">
                              {employee.avatar}
                            </div>
                            <div>
                              <p className="font-medium text-[#1A1A2E]">{employee.name}</p>
                              <p className="text-sm text-[#718096]">{employee.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-[#4A5568]">{employee.department}</span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(employee.status)}`}>
                            {getStatusIcon(employee.status)}
                            {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono text-[#2D9F6C] font-medium">{employee.streamRate}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Clock size={14} className="text-[#718096]" />
                            <span className="text-[#4A5568]">{employee.hoursToday}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-[#1A1A2E]">{employee.totalEarned}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 rounded-lg hover:bg-[#F5EDE6] text-[#4A5568] hover:text-[#6BB3D9] transition-colors">
                              <Eye size={16} />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-[#F5EDE6] text-[#4A5568] hover:text-[#F4A259] transition-colors">
                              <Edit2 size={16} />
                            </button>
                            <button className="p-2 rounded-lg hover:bg-[#E85A4F]/10 text-[#4A5568] hover:text-[#E85A4F] transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 border-t border-[#E8DED4] flex items-center justify-between">
                <p className="text-sm text-[#718096]">
                  Showing {filteredEmployees.length} of {employees.length} employees
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="border-[#E8DED4] text-[#4A5568]">
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" className="border-[#E8DED4] text-[#4A5568]">
                    Next
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>

      {/* Add Employee Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#1A1A2E]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-[#E8DED4]"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-[#1A1A2E] mb-6">Add New Employee</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#4A5568] mb-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="Enter employee name"
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF6F1] border border-[#E8DED4] text-[#1A1A2E] placeholder:text-[#718096] focus:outline-none focus:border-[#E85A4F]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4A5568] mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF6F1] border border-[#E8DED4] text-[#1A1A2E] placeholder:text-[#718096] focus:outline-none focus:border-[#E85A4F]/50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#4A5568] mb-2">Department</label>
                    <select className="w-full px-4 py-3 rounded-xl bg-[#FAF6F1] border border-[#E8DED4] text-[#1A1A2E] focus:outline-none focus:border-[#E85A4F]/50">
                      <option>Engineering</option>
                      <option>Design</option>
                      <option>Marketing</option>
                      <option>Human Resources</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4A5568] mb-2">Stream Rate</label>
                    <input
                      type="text"
                      placeholder="0.0010 USDC/sec"
                      className="w-full px-4 py-3 rounded-xl bg-[#FAF6F1] border border-[#E8DED4] text-[#1A1A2E] placeholder:text-[#718096] focus:outline-none focus:border-[#E85A4F]/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#4A5568] mb-2">Wallet Address</label>
                  <input
                    type="text"
                    placeholder="Enter Aptos wallet address"
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF6F1] border border-[#E8DED4] text-[#1A1A2E] placeholder:text-[#718096] focus:outline-none focus:border-[#E85A4F]/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1 border-[#E8DED4] text-[#4A5568]"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button className="flex-1">
                  <UserPlus size={18} className="mr-2" />
                  Add Employee
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
