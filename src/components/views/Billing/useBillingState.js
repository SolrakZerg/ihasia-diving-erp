import { useState, useRef } from 'react';

export function useBillingState() {
  const [todayArrivals, setTodayArrivals] = useState([]);
  const [loadingArrivals, setLoadingArrivals] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [allMonthInvoices, setAllMonthInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [sortBy, setSortBy] = useState('date');
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [staff, setStaff] = useState([]);
  const [bills50000, setBills50000] = useState('');
  const [bills1000, setBills1000] = useState('');
  const [bills500, setBills500] = useState('');
  const [bills100, setBills100] = useState('');
  const [bills50, setBills50] = useState('');
  const [bills20, setBills20] = useState('');
  const [selectedArrivalIds, setSelectedArrivalIds] = useState(new Set());
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const lastClickedIndex = useRef(null);
  const lastClickTime = useRef(0);
  const [toast, setToast] = useState(null);
  const [confirmConfig, setConfirmConfig] = useState({ show: false, title: '', message: '', onConfirm: () => {}, type: 'danger' });
  const [arrivalsDate, setArrivalsDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyToday, setShowOnlyToday] = useState(false);
  const [showOnlyUnpaid, setShowOnlyUnpaid] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');
  const [bulkDate, setBulkDate] = useState('');
  const [bulkInstructor, setBulkInstructor] = useState('');
  const [bulkActivity, setBulkActivity] = useState('');
  const [bulkGroupAction, setBulkGroupAction] = useState(null);
  const [instructorSearch, setInstructorSearch] = useState('');
  const [paymentMethodSearch, setPaymentMethodSearch] = useState('');
  const [showOnlyCommissionable, setShowOnlyCommissionable] = useState(false);
  const [isSavingCash, setIsSavingCash] = useState(false);
  const [loadingCash, setLoadingCash] = useState(true);
  const [dbExpectedCash, setDbExpectedCash] = useState(0);
  const [uiConfig, setUiConfig] = useState(null);
  const dateInputRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Totales oficiales de la base de datos
  const [monthlyDbData, setMonthlyDbData] = useState({ total_courses: 0, total_tanks: 0, total_spec: 0 });

  return {
    todayArrivals, setTodayArrivals,
    loadingArrivals, setLoadingArrivals,
    invoices, setInvoices,
    allMonthInvoices, setAllMonthInvoices,
    loadingInvoices, setLoadingInvoices,
    sortBy, setSortBy,
    activities, setActivities,
    categories, setCategories,
    staff, setStaff,
    bills50000, setBills50000,
    bills1000, setBills1000,
    bills500, setBills500,
    bills100, setBills100,
    bills50, setBills50,
    bills20, setBills20,
    selectedArrivalIds, setSelectedArrivalIds,
    selectedItemIds, setSelectedItemIds,
    lastClickedIndex,
    lastClickTime,
    toast, setToast,
    confirmConfig, setConfirmConfig,
    arrivalsDate, setArrivalsDate,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    selectedDay, setSelectedDay,
    searchTerm, setSearchTerm,
    showOnlyToday, setShowOnlyToday,
    showOnlyUnpaid, setShowOnlyUnpaid,
    activitySearch, setActivitySearch,
    bulkDate, setBulkDate,
    bulkInstructor, setBulkInstructor,
    bulkActivity, setBulkActivity,
    bulkGroupAction, setBulkGroupAction,
    instructorSearch, setInstructorSearch,
    paymentMethodSearch, setPaymentMethodSearch,
    showOnlyCommissionable, setShowOnlyCommissionable,
    isSavingCash, setIsSavingCash,
    loadingCash, setLoadingCash,
    dbExpectedCash, setDbExpectedCash,
    uiConfig, setUiConfig,
    dateInputRef,
    saveTimeoutRef,
    monthlyDbData, setMonthlyDbData,
  };
}
