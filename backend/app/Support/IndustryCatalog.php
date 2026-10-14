<?php

namespace App\Support;

class IndustryCatalog
{
    /**
     * Industry presets so any trade can use BizFlow with familiar language.
     *
     * @return array<string, array<string, mixed>>
     */
    public static function all(): array
    {
        return [
            'general' => self::definition(
                'general',
                'General business',
                'bi-building',
                'Retail, wholesale, or any custom operation',
                [
                    'customers' => 'Customers',
                    'products' => 'Products',
                    'inventory' => 'Inventory',
                    'orders' => 'Orders',
                    'invoices' => 'Invoices',
                    'employees' => 'Employees',
                    'projects' => 'Projects',
                    'tasks' => 'Tasks',
                ],
                ['General', 'Retail', 'Services'],
                'ORD',
                'INV'
            ),
            'barber' => self::definition(
                'barber',
                'Barber & salon',
                'bi-scissors',
                'Cuts, color, appointments, and retail products',
                [
                    'customers' => 'Clients',
                    'products' => 'Services & products',
                    'inventory' => 'Supplies',
                    'orders' => 'Appointments',
                    'invoices' => 'Invoices',
                    'employees' => 'Stylists',
                    'projects' => 'Campaigns',
                    'tasks' => 'Tasks',
                ],
                ['Haircuts', 'Beard & grooming', 'Coloring', 'Retail products'],
                'APT',
                'INV'
            ),
            'mechanic' => self::definition(
                'mechanic',
                'Auto mechanic',
                'bi-wrench-adjustable',
                'Jobs, parts, labor, and vehicle history',
                [
                    'customers' => 'Vehicle owners',
                    'products' => 'Parts & labor',
                    'inventory' => 'Parts stock',
                    'orders' => 'Work orders',
                    'invoices' => 'Invoices',
                    'employees' => 'Technicians',
                    'projects' => 'Fleet jobs',
                    'tasks' => 'Bay tasks',
                ],
                ['Oil & filters', 'Brakes', 'Diagnostics', 'Bodywork'],
                'WO',
                'INV'
            ),
            'plumber' => self::definition(
                'plumber',
                'Plumber',
                'bi-droplet-half',
                'Service calls, materials, and job tracking',
                [
                    'customers' => 'Clients',
                    'products' => 'Parts & services',
                    'inventory' => 'Van stock',
                    'orders' => 'Service jobs',
                    'invoices' => 'Invoices',
                    'employees' => 'Crew',
                    'projects' => 'Installations',
                    'tasks' => 'Tasks',
                ],
                ['Emergency calls', 'Installations', 'Maintenance', 'Materials'],
                'JOB',
                'INV'
            ),
            'electrician' => self::definition(
                'electrician',
                'Electrician',
                'bi-lightning-charge',
                'Quotes, materials, and scheduled installs',
                [
                    'customers' => 'Clients',
                    'products' => 'Materials & services',
                    'inventory' => 'Materials',
                    'orders' => 'Service jobs',
                    'invoices' => 'Invoices',
                    'employees' => 'Electricians',
                    'projects' => 'Installations',
                    'tasks' => 'Tasks',
                ],
                ['Residential', 'Commercial', 'Lighting', 'Panels'],
                'JOB',
                'INV'
            ),
            'restaurant' => self::definition(
                'restaurant',
                'Restaurant & cafe',
                'bi-cup-hot',
                'Menu items, tickets, suppliers, and staff',
                [
                    'customers' => 'Guests',
                    'products' => 'Menu items',
                    'inventory' => 'Kitchen stock',
                    'orders' => 'Tickets',
                    'invoices' => 'Invoices',
                    'employees' => 'Staff',
                    'projects' => 'Events',
                    'tasks' => 'Prep tasks',
                ],
                ['Starters', 'Mains', 'Drinks', 'Desserts'],
                'TKT',
                'INV'
            ),
            'cleaning' => self::definition(
                'cleaning',
                'Cleaning service',
                'bi-stars',
                'Recurring clients, supplies, and crew schedules',
                [
                    'customers' => 'Clients',
                    'products' => 'Services & supplies',
                    'inventory' => 'Supplies',
                    'orders' => 'Cleaning jobs',
                    'invoices' => 'Invoices',
                    'employees' => 'Cleaners',
                    'projects' => 'Contracts',
                    'tasks' => 'Checklists',
                ],
                ['Residential', 'Office', 'Deep clean', 'Supplies'],
                'JOB',
                'INV'
            ),
            'construction' => self::definition(
                'construction',
                'Construction',
                'bi-bricks',
                'Projects, materials, subcontractors, and billing',
                [
                    'customers' => 'Clients',
                    'products' => 'Materials & services',
                    'inventory' => 'Materials',
                    'orders' => 'Job orders',
                    'invoices' => 'Invoices',
                    'employees' => 'Crew',
                    'projects' => 'Sites',
                    'tasks' => 'Milestones',
                ],
                ['Materials', 'Labor', 'Equipment', 'Subcontractors'],
                'JOB',
                'INV'
            ),
            'clinic' => self::definition(
                'clinic',
                'Clinic & wellness',
                'bi-heart-pulse',
                'Patients, treatments, and follow-up care',
                [
                    'customers' => 'Patients',
                    'products' => 'Treatments',
                    'inventory' => 'Supplies',
                    'orders' => 'Visits',
                    'invoices' => 'Invoices',
                    'employees' => 'Practitioners',
                    'projects' => 'Care plans',
                    'tasks' => 'Follow-ups',
                ],
                ['Consultations', 'Treatments', 'Products', 'Packages'],
                'VST',
                'INV'
            ),
            'fitness' => self::definition(
                'fitness',
                'Fitness & gym',
                'bi-activity',
                'Members, packages, classes, and coaching',
                [
                    'customers' => 'Members',
                    'products' => 'Packages & retail',
                    'inventory' => 'Retail stock',
                    'orders' => 'Memberships',
                    'invoices' => 'Invoices',
                    'employees' => 'Coaches',
                    'projects' => 'Programs',
                    'tasks' => 'Sessions',
                ],
                ['Memberships', 'Personal training', 'Classes', 'Retail'],
                'MBR',
                'INV'
            ),
            'consulting' => self::definition(
                'consulting',
                'Consulting & agency',
                'bi-briefcase',
                'Clients, retainers, deliverables, and billable work',
                [
                    'customers' => 'Clients',
                    'products' => 'Services',
                    'inventory' => 'Assets',
                    'orders' => 'Engagements',
                    'invoices' => 'Invoices',
                    'employees' => 'Team',
                    'projects' => 'Engagements',
                    'tasks' => 'Deliverables',
                ],
                ['Retainer', 'Project work', 'Workshops', 'Add-ons'],
                'ENG',
                'INV'
            ),
            'retail' => self::definition(
                'retail',
                'Retail store',
                'bi-shop',
                'POS-style catalog, stock, and customer history',
                [
                    'customers' => 'Shoppers',
                    'products' => 'Catalog',
                    'inventory' => 'Stock',
                    'orders' => 'Sales',
                    'invoices' => 'Invoices',
                    'employees' => 'Staff',
                    'projects' => 'Seasons',
                    'tasks' => 'Tasks',
                ],
                ['Bestsellers', 'New arrivals', 'Accessories', 'Clearance'],
                'SALE',
                'INV'
            ),
            'clothing_boutique' => self::definition(
                'clothing_boutique',
                'Clothing boutique',
                'bi-handbag',
                'Fashion retail — garments, sizes, seasons, and boutique sales',
                [
                    'customers' => 'Clients',
                    'products' => 'Garments',
                    'inventory' => 'Stock',
                    'orders' => 'Sales',
                    'invoices' => 'Receipts',
                    'employees' => 'Sales staff',
                    'projects' => 'Collections',
                    'tasks' => 'Shop tasks',
                ],
                ['Women', 'Men', 'Kids', 'Accessories', 'New season', 'Sale'],
                'SALE',
                'INV'
            ),
            'shoe_store' => self::definition(
                'shoe_store',
                'Shoe store',
                'bi-tags',
                'Footwear retail with sizes, brands, and stock',
                [
                    'customers' => 'Shoppers',
                    'products' => 'Shoes',
                    'inventory' => 'Stock',
                    'orders' => 'Sales',
                    'invoices' => 'Receipts',
                    'employees' => 'Staff',
                    'projects' => 'Seasons',
                    'tasks' => 'Tasks',
                ],
                ['Women', 'Men', 'Kids', 'Sport', 'Accessories'],
                'SALE',
                'INV'
            ),
            'grocery' => self::definition(
                'grocery',
                'Grocery / minimarket',
                'bi-cart4',
                'Daily retail, suppliers, and fast stock turns',
                [
                    'customers' => 'Customers',
                    'products' => 'Products',
                    'inventory' => 'Stock',
                    'orders' => 'Sales',
                    'invoices' => 'Receipts',
                    'employees' => 'Cashiers',
                    'projects' => 'Promotions',
                    'tasks' => 'Restock tasks',
                ],
                ['Food', 'Drinks', 'Household', 'Fresh', 'Tobacco'],
                'SALE',
                'INV'
            ),
            'electronics' => self::definition(
                'electronics',
                'Electronics store',
                'bi-phone',
                'Phones, gadgets, warranties, and accessories',
                [
                    'customers' => 'Customers',
                    'products' => 'Devices',
                    'inventory' => 'Stock',
                    'orders' => 'Sales',
                    'invoices' => 'Invoices',
                    'employees' => 'Staff',
                    'projects' => 'Campaigns',
                    'tasks' => 'Tasks',
                ],
                ['Phones', 'Accessories', 'Audio', 'Computers', 'Repairs'],
                'SALE',
                'INV'
            ),
            'jewelry' => self::definition(
                'jewelry',
                'Jewelry store',
                'bi-gem',
                'Jewelry, watches, and high-value inventory',
                [
                    'customers' => 'Clients',
                    'products' => 'Pieces',
                    'inventory' => 'Vault stock',
                    'orders' => 'Sales',
                    'invoices' => 'Invoices',
                    'employees' => 'Staff',
                    'projects' => 'Collections',
                    'tasks' => 'Tasks',
                ],
                ['Gold', 'Silver', 'Watches', 'Custom', 'Repairs'],
                'SALE',
                'INV'
            ),
            'furniture' => self::definition(
                'furniture',
                'Furniture store',
                'bi-lamp',
                'Showroom sales, deliveries, and stock rooms',
                [
                    'customers' => 'Buyers',
                    'products' => 'Furniture',
                    'inventory' => 'Warehouse',
                    'orders' => 'Orders',
                    'invoices' => 'Invoices',
                    'employees' => 'Staff',
                    'projects' => 'Deliveries',
                    'tasks' => 'Delivery tasks',
                ],
                ['Living room', 'Bedroom', 'Office', 'Outdoor', 'Decor'],
                'ORD',
                'INV'
            ),
            'florist' => self::definition(
                'florist',
                'Florist',
                'bi-flower2',
                'Bouquets, events, and perishable stock',
                [
                    'customers' => 'Clients',
                    'products' => 'Arrangements',
                    'inventory' => 'Flowers',
                    'orders' => 'Orders',
                    'invoices' => 'Invoices',
                    'employees' => 'Florists',
                    'projects' => 'Events',
                    'tasks' => 'Prep',
                ],
                ['Bouquets', 'Weddings', 'Funeral', 'Plants', 'Gifts'],
                'ORD',
                'INV'
            ),
            'cafe' => self::definition(
                'cafe',
                'Cafe & coffee shop',
                'bi-cup-straw',
                'Drinks, pastries, quick tickets, and bar stock',
                [
                    'customers' => 'Guests',
                    'products' => 'Menu',
                    'inventory' => 'Bar stock',
                    'orders' => 'Tickets',
                    'invoices' => 'Receipts',
                    'employees' => 'Baristas',
                    'projects' => 'Events',
                    'tasks' => 'Prep',
                ],
                ['Coffee', 'Drinks', 'Pastries', 'Snacks'],
                'TKT',
                'INV'
            ),
            'hotel' => self::definition(
                'hotel',
                'Hotel & lodging',
                'bi-building',
                'Guests, stays, extras, and housekeeping tasks',
                [
                    'customers' => 'Guests',
                    'products' => 'Rooms & extras',
                    'inventory' => 'Supplies',
                    'orders' => 'Bookings',
                    'invoices' => 'Folios',
                    'employees' => 'Staff',
                    'projects' => 'Events',
                    'tasks' => 'Housekeeping',
                ],
                ['Rooms', 'Breakfast', 'Extras', 'Events'],
                'BKG',
                'INV'
            ),
            'dental' => self::definition(
                'dental',
                'Dental clinic',
                'bi-emoji-smile',
                'Patients, treatments, and follow-up care',
                [
                    'customers' => 'Patients',
                    'products' => 'Treatments',
                    'inventory' => 'Supplies',
                    'orders' => 'Visits',
                    'invoices' => 'Invoices',
                    'employees' => 'Dentists',
                    'projects' => 'Treatment plans',
                    'tasks' => 'Follow-ups',
                ],
                ['Check-up', 'Cleaning', 'Fillings', 'Orthodontics'],
                'VST',
                'INV'
            ),
            'education' => self::definition(
                'education',
                'Courses & tutoring',
                'bi-mortarboard',
                'Students, classes, packages, and schedules',
                [
                    'customers' => 'Students',
                    'products' => 'Courses',
                    'inventory' => 'Materials',
                    'orders' => 'Enrollments',
                    'invoices' => 'Invoices',
                    'employees' => 'Teachers',
                    'projects' => 'Classes',
                    'tasks' => 'Lessons',
                ],
                ['Group courses', 'Private lessons', 'Exam prep', 'Materials'],
                'ENR',
                'INV'
            ),
            'bakery' => self::definition(
                'bakery',
                'Bakery',
                'bi-basket2',
                'Orders, recipes, flour stock, and morning production',
                [
                    'customers' => 'Buyers',
                    'products' => 'Baked goods',
                    'inventory' => 'Ingredients',
                    'orders' => 'Bake orders',
                    'invoices' => 'Invoices',
                    'employees' => 'Bakers',
                    'projects' => 'Production runs',
                    'tasks' => 'Prep lists',
                ],
                ['Bread', 'Pastries', 'Cakes', 'Ingredients'],
                'BKE',
                'INV'
            ),
            'carpenter' => self::definition(
                'carpenter',
                'Carpenter / woodwork',
                'bi-hammer',
                'Custom jobs, materials, and workshop schedules',
                [
                    'customers' => 'Clients',
                    'products' => 'Materials & services',
                    'inventory' => 'Timber & hardware',
                    'orders' => 'Build jobs',
                    'invoices' => 'Invoices',
                    'employees' => 'Craftsmen',
                    'projects' => 'Builds',
                    'tasks' => 'Shop tasks',
                ],
                ['Furniture', 'Doors & frames', 'Repairs', 'Materials'],
                'JOB',
                'INV'
            ),
            'tailor' => self::definition(
                'tailor',
                'Tailor / fashion',
                'bi-scissors',
                'Alterations, fittings, fabrics, and deliveries',
                [
                    'customers' => 'Clients',
                    'products' => 'Garments & services',
                    'inventory' => 'Fabrics',
                    'orders' => 'Orders',
                    'invoices' => 'Invoices',
                    'employees' => 'Tailors',
                    'projects' => 'Collections',
                    'tasks' => 'Fittings',
                ],
                ['Alterations', 'Custom suits', 'Fabrics', 'Accessories'],
                'ORD',
                'INV'
            ),
            'pharmacy' => self::definition(
                'pharmacy',
                'Pharmacy',
                'bi-capsule',
                'Patients, prescriptions, and inventory controls',
                [
                    'customers' => 'Patients',
                    'products' => 'Medicines',
                    'inventory' => 'Stock',
                    'orders' => 'Prescriptions',
                    'invoices' => 'Invoices',
                    'employees' => 'Pharmacists',
                    'projects' => 'Campaigns',
                    'tasks' => 'Checks',
                ],
                ['OTC', 'Prescription', 'Wellness', 'Devices'],
                'RX',
                'INV'
            ),
            'photography' => self::definition(
                'photography',
                'Photography studio',
                'bi-camera',
                'Sessions, packages, galleries, and bookings',
                [
                    'customers' => 'Clients',
                    'products' => 'Packages',
                    'inventory' => 'Gear',
                    'orders' => 'Bookings',
                    'invoices' => 'Invoices',
                    'employees' => 'Photographers',
                    'projects' => 'Shoots',
                    'tasks' => 'Edits',
                ],
                ['Weddings', 'Portraits', 'Commercial', 'Prints'],
                'BKG',
                'INV'
            ),
            'beauty' => self::definition(
                'beauty',
                'Beauty & spa',
                'bi-flower1',
                'Treatments, appointments, and retail products',
                [
                    'customers' => 'Clients',
                    'products' => 'Treatments & retail',
                    'inventory' => 'Products',
                    'orders' => 'Appointments',
                    'invoices' => 'Invoices',
                    'employees' => 'Therapists',
                    'projects' => 'Packages',
                    'tasks' => 'Prep',
                ],
                ['Facial', 'Nails', 'Massage', 'Retail'],
                'APT',
                'INV'
            ),
            'landscaping' => self::definition(
                'landscaping',
                'Landscaping & garden',
                'bi-tree',
                'Outdoor jobs, plants, equipment, and crews',
                [
                    'customers' => 'Clients',
                    'products' => 'Services & plants',
                    'inventory' => 'Materials',
                    'orders' => 'Site jobs',
                    'invoices' => 'Invoices',
                    'employees' => 'Crew',
                    'projects' => 'Gardens',
                    'tasks' => 'Site tasks',
                ],
                ['Maintenance', 'Design', 'Planting', 'Hardscape'],
                'JOB',
                'INV'
            ),
            'pet' => self::definition(
                'pet',
                'Pet services',
                'bi-heart',
                'Grooming, boarding, and pet-owner CRM',
                [
                    'customers' => 'Pet owners',
                    'products' => 'Services & retail',
                    'inventory' => 'Supplies',
                    'orders' => 'Bookings',
                    'invoices' => 'Invoices',
                    'employees' => 'Groomers',
                    'projects' => 'Programs',
                    'tasks' => 'Care tasks',
                ],
                ['Grooming', 'Boarding', 'Training', 'Retail'],
                'BKG',
                'INV'
            ),
        ];
    }

    public static function keys(): array
    {
        return array_keys(self::all());
    }

    public static function get(string $slug): array
    {
        $all = self::all();

        return $all[$slug] ?? $all['general'];
    }

    public static function listForApi(): array
    {
        return array_values(self::all());
    }

    /**
     * @param  array<string, string>  $labels
     * @param  array<int, string>  $categories
     */
    protected static function definition(
        string $slug,
        string $name,
        string $icon,
        string $description,
        array $labels,
        array $categories,
        string $orderPrefix,
        string $invoicePrefix,
    ): array {
        return [
            'slug' => $slug,
            'name' => $name,
            'icon' => $icon,
            'description' => $description,
            'labels' => $labels,
            'default_categories' => $categories,
            'order_prefix' => $orderPrefix,
            'invoice_prefix' => $invoicePrefix,
        ];
    }
}
