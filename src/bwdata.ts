export interface BWData {
    date: string;
    src_region: string;
    src_location: string;
    src_zone: string;
    src_vip: string;
    src_device: string;
    src_ip: string;

    dest_region: string;
    dest_location: string;
    dest_zone: string;
    dest_vip: string;
    dest_device: string;
    dest_ip: string;

    calc_bandwidth: string;
}

export interface BW_RESULT_LINE {
    date: string;
    src_region: string;
    src_location: string;
    src_zone: string;
    src_vip: string;
    src_device: string;
    src_ip: string;

    dest_region: string;
    dest_location: string;
    dest_zone: string;
    dest_vip: string;
    dest_device: string;
    dest_ip: string;

    calc_bandwidth: string;
    from_ip: string;
}

export interface DESTINATION_INFO {
    dest_device: string;
    dest_ip: string;
    dest_vip: string;
    dest_zone: string;
}

export interface BWDLY_ROW_DATA {
    date: string;
    src_region: string;
    src_location: string;
    src_zone: string;
    src_vip: string;
    src_device: string;
    src_ip: string;
    dest_ip: string;
    dest_device: string;
    dest_vip: string;
    dest_zone: string;
    dest_location: string;
    dest_region: string;
    calc_bandwidth: string;
}
