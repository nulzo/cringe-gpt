import React, {useCallback, useState} from 'react';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select';
import {Button} from '@/components/ui/button';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,} from '@/components/ui/dropdown-menu';
import {Badge} from '@/components/ui/badge';
import {Check, ChevronDown, Globe} from 'lucide-react';
import {cn} from '@/lib/utils';
import {useI18nContext} from '../provider';
import {useT} from '../hooks';
import {getAvailableLanguages, getLanguageDisplayName} from '../utils';
import type {LanguageSwitcherProps, SupportedLanguage} from '../types';

/**
 * Language Switcher Component
 *
 * A flexible component for switching between supported languages
 * with multiple display modes and customization options.
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
                                                                      labels,
                                                                      mode = 'dropdown',
                                                                      size = 'md',
                                                                      variant = 'default',
                                                                      showFlags = false,
                                                                      flagComponent: FlagComponent,
                                                                      className,
                                                                      disabled = false,
                                                                      onLanguageChange,
                                                                  }) => {
    const {currentLanguage, changeLanguage, isLoading} = useI18nContext();
    const {t} = useT('navigation');
    const [isChanging, setIsChanging] = useState(false);

    const availableLanguages = getAvailableLanguages();

    const handleLanguageChange = useCallback(
        async (language: SupportedLanguage) => {
            if (language === currentLanguage || disabled || isChanging) {
                return;
            }

            try {
                setIsChanging(true);
                await changeLanguage(language);
                onLanguageChange?.(language);
            } catch (error) {
                console.error('Failed to change language:', error);
            } finally {
                setIsChanging(false);
            }
        },
        [currentLanguage, changeLanguage, disabled, isChanging, onLanguageChange]
    );

    const getLanguageLabel = (lang: SupportedLanguage): string => {
        return labels?.[lang] || getLanguageDisplayName(lang);
    };

    const isActive = useCallback(
        (lang: SupportedLanguage) => lang === currentLanguage,
        [currentLanguage]
    );

    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'h-8 px-2 text-xs';
            case 'lg':
                return 'h-11 px-4 text-base';
            default:
                return 'h-9 px-3 text-sm';
        }
    };

    const renderFlag = (language: SupportedLanguage) => {
        if (!showFlags) return null;

        if (FlagComponent) {
            return <FlagComponent language={language} size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20}/>;
        }

        // Fallback to emoji flags
        const flagEmojis: Record<SupportedLanguage, string> = {
            en: '🇺🇸',
            es: '🇪🇸',
            fr: '🇫🇷',
            de: '🇩🇪',
            it: '🇮🇹',
            pt: '🇵🇹',
            ru: '🇷🇺',
            zh: '🇨🇳',
            ja: '🇯🇵',
            ko: '🇰🇷',
        };

        return (
            <span className="mr-2" role="img" aria-label={`${getLanguageLabel(language)} flag`}>
        {flagEmojis[language] || '🌐'}
      </span>
        );
    };

    if (mode === 'select') {
        return (
            <Select
                value={currentLanguage}
                onValueChange={handleLanguageChange}
                disabled={disabled || isLoading || isChanging}
            >
                <SelectTrigger className={cn(getSizeClasses(), className)}>
                    <div className="flex items-center">
                        {renderFlag(currentLanguage)}
                        <SelectValue>
                            {getLanguageLabel(currentLanguage)}
                        </SelectValue>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {availableLanguages.map((language) => (
                        <SelectItem key={language} value={language}>
                            <div className="flex items-center">
                                {renderFlag(language)}
                                <span>{getLanguageLabel(language)}</span>
                                {isActive(language) && (
                                    <Check className="ml-auto h-4 w-4"/>
                                )}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    }

    if (mode === 'buttons') {
        return (
            <div className={cn('flex flex-wrap gap-2', className)}>
                {availableLanguages.map((language) => (
                    <Button
                        key={language}
                        variant={isActive(language) ? variant : 'outline'}
                        size={size === 'md' ? 'default' : size === 'lg' ? 'lg' : 'sm'}
                        onClick={() => handleLanguageChange(language)}
                        disabled={disabled || isLoading || isChanging}
                        className={cn(
                            'transition-all duration-200',
                            isActive(language) && 'ring-2 ring-primary ring-offset-2'
                        )}
                    >
                        {renderFlag(language)}
                        <span className={showFlags ? 'ml-1' : ''}>{getLanguageLabel(language)}</span>
                    </Button>
                ))}
            </div>
        );
    }

    // Default: dropdown mode
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant={variant}
                    size={size === 'md' ? 'default' : size}
                    className={cn(
                        'justify-between',
                        getSizeClasses(),
                        className
                    )}
                    disabled={disabled || isLoading || isChanging}
                >
                    <div className="flex items-center">
                        <Globe className="mr-2 h-4 w-4"/>
                        {renderFlag(currentLanguage)}
                        <span className={showFlags ? 'ml-1' : ''}>
              {getLanguageLabel(currentLanguage)}
            </span>
                    </div>
                    <ChevronDown className="ml-2 h-4 w-4"/>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                {availableLanguages.map((language) => (
                    <DropdownMenuItem
                        key={language}
                        onClick={() => handleLanguageChange(language)}
                        className={cn(
                            'flex items-center justify-between cursor-pointer',
                            isActive(language) && 'bg-accent'
                        )}
                    >
                        <div className="flex items-center">
                            {renderFlag(language)}
                            <span className={showFlags ? 'ml-1' : ''}>{getLanguageLabel(language)}</span>
                        </div>
                        {isActive(language) && (
                            <Check className="h-4 w-4 text-primary"/>
                        )}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

/**
 * Compact Language Switcher
 *
 * A minimal language switcher that only shows the flag or language code
 */
export const CompactLanguageSwitcher: React.FC<
    Omit<LanguageSwitcherProps, 'mode'> & { showCode?: boolean }
> = ({showCode = false, ...props}) => {
    const {currentLanguage} = useI18nContext();

    return (
        <LanguageSwitcher
            {...props}
            mode="dropdown"
            labels={
                showCode
                    ? Object.fromEntries(
                        getAvailableLanguages().map(lang => [lang, lang.toUpperCase()])
                    )
                    : props.labels
            }
            showFlags={!showCode}
            className={cn('w-auto min-w-0', props.className)}
        />
    );
};

/**
 * Language Badge
 *
 * Displays the current language as a badge
 */
export const LanguageBadge: React.FC<{
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    showFlag?: boolean;
    className?: string;
}> = ({variant = 'outline', size = 'md', showFlag = true, className}) => {
    const {currentLanguage} = useI18nContext();

    const getSizeClasses = () => {
        switch (size) {
            case 'sm':
                return 'text-xs px-1.5 py-0.5';
            case 'lg':
                return 'text-base px-3 py-1';
            default:
                return 'text-sm px-2 py-1';
        }
    };

    return (
        <Badge variant={variant} className={cn(getSizeClasses(), className)}>
            {showFlag && (
                <span className="mr-1" role="img" aria-label="Current language flag">
          {{
              en: '🇺🇸',
              es: '🇪🇸',
              fr: '🇫🇷',
              de: '🇩🇪',
              it: '🇮🇹',
              pt: '🇵🇹',
              ru: '🇷🇺',
              zh: '🇨🇳',
              ja: '🇯🇵',
              ko: '🇰🇷',
          }[currentLanguage] || '🌐'}
        </span>
            )}
            {getLanguageDisplayName(currentLanguage)}
        </Badge>
    );
};

/**
 * Language Status Indicator
 *
 * Shows loading/error states for language switching
 */
export const LanguageStatusIndicator: React.FC<{
    className?: string;
}> = ({className}) => {
    const {isLoading, error, isReady} = useI18nContext();
    const {t} = useT('common');

    if (isLoading) {
        return (
            <div className={cn('flex items-center text-sm text-muted-foreground', className)}>
                <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent"/>
                {t('loading')}
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn('flex items-center text-sm text-destructive', className)}>
                <div className="mr-2 h-3 w-3 rounded-full bg-current"/>
                {t('error')}
            </div>
        );
    }

    if (isReady) {
        return (
            <div className={cn('flex items-center text-sm text-green-600', className)}>
                <div className="mr-2 h-3 w-3 rounded-full bg-current"/>
                Ready
            </div>
        );
    }

    return null;
};

export default LanguageSwitcher; 