import React, { useRef } from 'react';
import { format, parseISO } from 'date-fns';
import Form from 'react-bootstrap/Form';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PickDate = ({ dob = '', onDateChange, disabled, label, maxDate, minDate, onClick, className }) => {
    const hiddenRef = useRef(null);

    // Normalize any date string/object → 'YYYY-MM-DD' for the hidden input value
    const toIsoValue = (date) => {
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
            if (!isNaN(parsed.getTime())) return format(parsed, 'yyyy-MM-dd');
        } catch (e) {}
        try {
            const d = new Date(date);
            if (!isNaN(d.getTime())) return format(d, 'yyyy-MM-dd');
        } catch (e) {}
        return '';
    };

    // Convert 'YYYY-MM-DD' → '30/Oct/2008'
    const toDisplayValue = (iso) => {
        if (!iso) return '';
        const parts = iso.split('-');
        if (parts.length === 3) {
            const [year, month, day] = parts;
            const monthIdx = parseInt(month, 10) - 1;
            if (monthIdx >= 0 && monthIdx < 12) {
                return `${day}/${MONTHS[monthIdx]}/${year}`;
            }
        }
        return iso;
    };

    const getTodayDate = () => format(new Date(), 'yyyy-MM-dd');

    const openPicker = () => {
        if (disabled) return;
        if (hiddenRef.current) {
            try { hiddenRef.current.showPicker(); } catch (e) {
                hiddenRef.current.focus();
                hiddenRef.current.click();
            }
        }
        if (onClick) onClick();
    };

    const handleDateChange = (e) => {
        onDateChange(e.target.value);  // always YYYY-MM-DD
    };

    const isoValue = toIsoValue(dob);
    const displayValue = toDisplayValue(isoValue);

    return (
        <Form.Group controlId="formDob" className="form-group">
            <Form.Label className="form-label">{label || 'Date of Birth*'}</Form.Label>
            <div style={{ position: 'relative' }}>
                {/* Visible formatted text field */}
                <Form.Control
                    type="text"
                    value={displayValue}
                    placeholder="DD/Mon/YYYY"
                    readOnly
                    disabled={disabled}
                    onClick={openPicker}
                    required
                    className={className || 'form-control custom-placeholder'}
                    style={{ cursor: disabled ? 'not-allowed' : 'pointer', paddingRight: '2.5rem' }}
                />
                {/* Calendar icon trigger */}
                <span
                    onClick={openPicker}
                    style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        fontSize: '1.1rem',
                        color: '#888',
                        userSelect: 'none',
                        pointerEvents: disabled ? 'none' : 'auto',
                    }}
                    aria-label="Open date picker"
                >
                    📅
                </span>
                {/* Hidden native date input — owns actual value, min, max */}
                <input
                    ref={hiddenRef}
                    type="date"
                    value={isoValue}
                    onChange={handleDateChange}
                    min={minDate || ''}
                    max={maxDate || getTodayDate()}
                    disabled={disabled}
                    tabIndex={-1}
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        opacity: 0,
                        width: '1px',
                        height: '1px',
                        top: 0,
                        right: 0,
                        pointerEvents: 'none',
                    }}
                />
            </div>
        </Form.Group>
    );
};

export default PickDate;
