import React from 'react';
import { format, parseISO } from 'date-fns';
import Form from 'react-bootstrap/Form';

const PickDate = ({ dob = '', onDateChange, disabled, label, maxDate, minDate, onClick, className }) => {
    const formatDate = (date) => {
        if (!date) return '';
        if (typeof date === 'string') {
            const trimmed = date.trim();
            if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
            const parts = trimmed.split(/[-/]/);
            if (parts.length === 3) {
                if (parts[2].length === 4) {
                    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                } else if (parts[0].length === 4) {
                    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                }
            }
        }
        try {
            const parsed = typeof date === 'string' ? parseISO(date) : new Date(date);
            if (!isNaN(parsed.getTime())) {
                return format(parsed, 'yyyy-MM-dd');
            }
        } catch (e) {}
        try {
            const d = new Date(date);
            if (!isNaN(d.getTime())) {
                return format(d, 'yyyy-MM-dd');
            }
        } catch (e) {}
        return '';
    };

    const getTodayDate = () => {
        return format(new Date(), 'yyyy-MM-dd');
    };

    const handleDateChange = (e) => {
        const newDate = e.target.value;
        onDateChange(newDate);
    };

    const handleClick = (e) => {
        if (!disabled && e.target && typeof e.target.showPicker === 'function') {
            try {
                e.target.showPicker();
            } catch (err) {}
        }
        if (onClick) onClick(e);
    };

    return (
        <Form.Group controlId="formDob" className="form-group">
            <Form.Label className="form-label">{label || "Date of Birth*"}</Form.Label>
            <Form.Control
                type="date"
                value={formatDate(dob)}
                onChange={handleDateChange}
                onClick={handleClick}
                required
                disabled={disabled}
                max={maxDate || getTodayDate()}
                min={minDate}
                className={className || "form-control custom-placeholder"}
            />
        </Form.Group>
    );
};

export default PickDate;
